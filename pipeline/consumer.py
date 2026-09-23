import json
import logging
import os
import signal
import time
from datetime import datetime

import psycopg2
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from psycopg2.extras import execute_batch

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable must be set")
TOPIC = "server-metrics"
CONSUMER_GROUP = "metrics-consumer-group"
BATCH_SIZE = 50
BATCH_TIMEOUT = 5.0 # seconds

running = True

def signal_handler(sig, frame):
    global running
    logging.info("Shutting down gracefully...")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def get_target_mapping(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT ip_address, port, id FROM targets")
            rows = cur.fetchall()
            # Map "ip:port" to id
            return {f"{row[0]}:{row[1]}": row[2] for row in rows}
    except Exception as e:
        logging.error(f"Error fetching targets: {e}")
        return {}

def insert_batch(conn, batch, target_mapping):
    query = """
        INSERT INTO metric_snapshots
        (target_id, instance, cpu_usage_percent, memory_usage_percent, disk_usage_percent, load_1m,
         memory_total_bytes, memory_available_bytes, disk_total_bytes, disk_free_bytes, network_receive_rate, network_transmit_rate, recorded_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    records = []
    for msg in batch:
        try:
            payload = json.loads(msg.value.decode('utf-8'))
            instance = payload.get("instance")
            if not instance:
                continue

            # Strip protocol if present in instance
            if "://" in instance:
                instance = instance.split("://")[1]

            target_id = target_mapping.get(instance)
            if not target_id:
                # We could try to match just by IP
                ip_only = instance.split(":")[0] if ":" in instance else instance
                for map_inst, map_id in target_mapping.items():
                    if map_inst.startswith(ip_only + ":"):
                        target_id = map_id
                        break

            if not target_id:
                logging.warning(f"Unknown target instance: {instance}. Skipping.")
                continue

            recorded_at_ts = payload.get("timestamp")
            if recorded_at_ts:
                recorded_at = datetime.fromisoformat(recorded_at_ts.replace('Z', '+00:00'))
            else:
                recorded_at = datetime.utcnow()

            metrics = payload.get("metrics", {})
            cpu = metrics.get("cpu_usage_percent")
            mem = metrics.get("memory_usage_percent")
            disk = metrics.get("disk_usage_percent")
            load = metrics.get("load_1m")
            mem_tot = metrics.get("memory_total_bytes")
            mem_avail = metrics.get("memory_available_bytes")
            disk_tot = metrics.get("disk_total_bytes")
            disk_free = metrics.get("disk_free_bytes")
            net_recv = metrics.get("network_receive_rate")
            net_trans = metrics.get("network_transmit_rate")

            # The JSON from producer might have lists for values, let's unpack if needed
            def safe_float(val):
                if isinstance(val, list) and len(val) == 2:
                    return float(val[1])
                elif val is not None:
                    return float(val)
                return None

            records.append((
                target_id, instance,
                safe_float(cpu), safe_float(mem), safe_float(disk), safe_float(load),
                safe_float(mem_tot), safe_float(mem_avail), safe_float(disk_tot),
                safe_float(disk_free), safe_float(net_recv), safe_float(net_trans),
                recorded_at
            ))
        except Exception as e:
            logging.error(f"Error processing message {msg.value}: {e}")

    if not records:
        return True

    try:
        with conn.cursor() as cur:
            execute_batch(cur, query, records)
        conn.commit()
        return True
    except Exception as e:
        logging.error(f"Database insertion failed: {e}")
        conn.rollback()
        return False

def main():
    # Wait for DB
    db_conn = None
    while not db_conn and running:
        try:
            db_conn = psycopg2.connect(DATABASE_URL)
            logging.info("Connected to PostgreSQL")
        except psycopg2.OperationalError:
            logging.warning("Database not ready, retrying in 5 seconds...")
            time.sleep(5)

    # Wait for Kafka
    consumer = None
    while not consumer and running:
        try:
            consumer = KafkaConsumer(
                TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id=CONSUMER_GROUP,
                enable_auto_commit=False,
                auto_offset_reset='earliest'
            )
            logging.info(f"Connected to Kafka, subscribed to {TOPIC}")
        except KafkaError:
            logging.warning("Kafka not ready, retrying in 5 seconds...")
            time.sleep(5)

    if not running:
        if db_conn:
            db_conn.close()
        if consumer:
            consumer.close()
        return

    target_mapping = get_target_mapping(db_conn)
    last_mapping_refresh = time.time()

    batch = []
    last_batch_time = time.time()

    while running:
        # Refresh target mapping every 5 minutes
        if time.time() - last_mapping_refresh > 300:
            target_mapping = get_target_mapping(db_conn)
            last_mapping_refresh = time.time()

        try:
            messages = consumer.poll(timeout_ms=1000)
            for tp, msgs in messages.items():
                for msg in msgs:
                    batch.append(msg)

            current_time = time.time()
            if len(batch) >= BATCH_SIZE or (batch and current_time - last_batch_time >= BATCH_TIMEOUT):
                success = insert_batch(db_conn, batch, target_mapping)
                if success:
                    consumer.commit()
                batch.clear()
                last_batch_time = current_time

        except Exception as e:
            logging.error(f"Error in consumer loop: {e}")
            time.sleep(1)

    # Final cleanup
    if batch:
        success = insert_batch(db_conn, batch, target_mapping)
        if success:
            consumer.commit()

    if consumer:
        consumer.close()
    if db_conn:
        db_conn.close()
    logging.info("Consumer shutdown complete")

if __name__ == "__main__":
    main()
