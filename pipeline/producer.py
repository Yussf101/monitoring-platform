import json
import logging
import os
import signal
import time
from datetime import datetime, timezone

import requests
from kafka import KafkaProducer
from kafka.errors import KafkaError

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://prometheus:9090")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))
KAFKA_TOPIC = "server-metrics"

running = True

def handle_shutdown(signum, frame):
    global running
    logger.info("Received shutdown signal, terminating...")
    running = False

signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

def get_prometheus_query(query):
    try:
        response = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={'query': query}, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get('status') == 'success':
            return data['data']['result']
        else:
            logger.error(f"Prometheus query failed: {data}")
            return []
    except requests.RequestException as e:
        logger.error(f"Error querying Prometheus: {e}")
        return []

def collect_metrics():
    # 1. CPU Usage %
    cpu_query = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
    cpu_results = get_prometheus_query(cpu_query)

    # 2. Memory Usage %
    mem_query = '100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)'
    mem_results = get_prometheus_query(mem_query)

    # 3. Disk Usage %
    # Ignoring mountpoint filter strictly because some instances might have different mountpoints,
    # but the instructions hint at basic root filesystem or similar.
    # Let's use mountpoint="/" or device matches to be safe.
    # Actually, the instructions say `node_filesystem_avail_bytes / node_filesystem_size_bytes`
    disk_query = '100 * (1 - sum by (instance) (node_filesystem_avail_bytes{fstype=~"ext.*|xfs",mountpoint="/"}) / sum by (instance) (node_filesystem_size_bytes{fstype=~"ext.*|xfs",mountpoint="/"}))'
    disk_results = get_prometheus_query(disk_query)

    # 4. Load 1m
    load_query = 'node_load1'
    load_results = get_prometheus_query(load_query)

    # 5. Additional Memory Metrics
    mem_total_results = get_prometheus_query('node_memory_MemTotal_bytes')
    mem_avail_results = get_prometheus_query('node_memory_MemAvailable_bytes')

    # 6. Additional Disk Metrics
    disk_total_results = get_prometheus_query('sum by (instance) (node_filesystem_size_bytes{fstype=~"ext.*|xfs",mountpoint="/"})')
    disk_free_results = get_prometheus_query('sum by (instance) (node_filesystem_avail_bytes{fstype=~"ext.*|xfs",mountpoint="/"})')

    # 7. Network Rate Metrics
    net_recv_results = get_prometheus_query('sum by (instance) (rate(node_network_receive_bytes_total[5m]))')
    net_trans_results = get_prometheus_query('sum by (instance) (rate(node_network_transmit_bytes_total[5m]))')

    # Aggregate metrics by instance
    instances = {}

    def extract_values(results, key, type_cast=float):
        for res in results:
            instance = res['metric'].get('instance')
            if not instance:
                continue
            if instance not in instances:
                instances[instance] = {}
            val = type_cast(res['value'][1])
            instances[instance][key] = val

    extract_values(cpu_results, 'cpu_usage_percent')
    extract_values(mem_results, 'memory_usage_percent')
    extract_values(disk_results, 'disk_usage_percent')
    extract_values(load_results, 'load_1m')

    extract_values(mem_total_results, 'memory_total_bytes')
    extract_values(mem_avail_results, 'memory_available_bytes')
    extract_values(disk_total_results, 'disk_total_bytes')
    extract_values(disk_free_results, 'disk_free_bytes')
    extract_values(net_recv_results, 'network_receive_rate')
    extract_values(net_trans_results, 'network_transmit_rate')

    return instances

def main():
    logger.info(f"Starting metrics producer. Kafka: {KAFKA_BOOTSTRAP_SERVERS}, Prometheus: {PROMETHEUS_URL}, Poll: {POLL_INTERVAL}s")

    producer = None
    while running and producer is None:
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8')
            )
            logger.info("Successfully connected to Kafka.")
        except KafkaError as e:
            logger.error(f"Failed to connect to Kafka, retrying in 5s... Error: {e}")
            time.sleep(5)

    while running:
        start_time = time.time()

        metrics_by_instance = collect_metrics()
        # Convert timezone-aware datetime to ISO 8601 string including the 'Z' format
        now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

        for instance, metrics in metrics_by_instance.items():
            payload = {
                "instance": instance,
                "timestamp": now,
                "metrics": {
                    "cpu_usage_percent": metrics.get('cpu_usage_percent', 0.0),
                    "memory_usage_percent": metrics.get('memory_usage_percent', 0.0),
                    "disk_usage_percent": metrics.get('disk_usage_percent', 0.0),
                    "load_1m": metrics.get('load_1m', 0.0),
                    "memory_total_bytes": metrics.get('memory_total_bytes', 0.0),
                    "memory_available_bytes": metrics.get('memory_available_bytes', 0.0),
                    "disk_total_bytes": metrics.get('disk_total_bytes', 0.0),
                    "disk_free_bytes": metrics.get('disk_free_bytes', 0.0),
                    "network_receive_rate": metrics.get('network_receive_rate', 0.0),
                    "network_transmit_rate": metrics.get('network_transmit_rate', 0.0)
                }
            }
            try:
                producer.send(KAFKA_TOPIC, key=instance, value=payload)
            except Exception as e:
                logger.error(f"Error sending message to Kafka for instance {instance}: {e}")

        if producer:
            producer.flush()
            if metrics_by_instance:
                logger.info(f"Published metrics for {len(metrics_by_instance)} instances.")

        elapsed = time.time() - start_time
        sleep_time = max(0, POLL_INTERVAL - elapsed)

        end_sleep = time.time() + sleep_time
        while running and time.time() < end_sleep:
            time.sleep(0.5)

    if producer:
        producer.close()
    logger.info("Producer shutdown complete.")

if __name__ == "__main__":
    main()
