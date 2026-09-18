# Monitoring Project — Hurdles, Bugs, Fixes & Lessons Learned

> **Purpose:** This document is a handoff/knowledge-base for an AI agent upgrading the Prometheus + Grafana + Node Exporter monitoring project.
>
> It records the problems encountered during the project, the fixes that were actually tested, important environment constraints, and design decisions. Do **not** assume every suggested workaround below is production-safe; distinguish between confirmed fixes, diagnostic steps, and experiments.

---

# 1. Project Context

The project is a Docker-based monitoring stack designed to monitor multiple Linux VMs.

## Architecture

```text
                    Monitoring VM
              ┌─────────────────────────┐
              │ Docker                  │
              │                         │
              │  Prometheus :9090       │
              │       │                 │
              │       ▼                 │
              │  Grafana :3000          │
              └─────────┬───────────────┘
                        │
              HTTP scrape :9100
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
      Linux VM 1     Linux VM 2     Linux VM 3
      Node Exporter  Node Exporter  Node Exporter
      :9100          :9100          :9100
```

The monitoring VM is separate from the monitored VMs.

The project dynamically discovers monitored instances through Prometheus labels and a Grafana `$instance` variable.

---

# 2. Final Project Structure

```text
monitoring-project/
├── docker-compose.yml
├── generate-prometheus-config.sh
├── prometheus/
│   ├── prometheus.template.yml
│   └── prometheus.yml
├── grafana/
│   ├── grafana.ini
│   └── provisioning/
│       ├── dashboards/
│       │   └── node-dashboard.json
│       ├── datasources/
│       │   └── prometheus-datasource.yml
│       └── variables/
│           └── variables.yml
├── README.md
└── vm_list.txt
```

## Important roles

- `docker-compose.yml`: runs Prometheus and Grafana.
- `generate-prometheus-config.sh`: generates the final Prometheus configuration from the VM list.
- `prometheus.template.yml`: Prometheus configuration template containing the dynamic VM target placeholder.
- `prometheus.yml`: generated Prometheus configuration actually consumed by Prometheus.
- `vm_list.txt`: list of monitored VM IPs/hostnames.
- `grafana.ini`: Grafana server/security configuration.
- `prometheus-datasource.yml`: provisions Prometheus automatically as Grafana's datasource.
- `variables.yml`: provisions/configures Grafana variables, especially the dynamic instance selector.
- `node-dashboard.json`: Grafana dashboard containing CPU, RAM, disk and network panels.

---

# 3. Initial Grafana Access Problem

## Symptom

Grafana could not be accessed from the PC browser.

Testing from the monitoring VM with:

```bash
curl localhost:3000
```

returned a connection failure.

## Diagnosis

The first thing to verify is whether Grafana is actually running and whether port 3000 is published by Docker.

Useful commands:

```bash
docker ps
docker ps -a
docker logs grafana
```

The Docker Compose configuration must contain:

```yaml
ports:
  - "3000:3000"
```

The Grafana container eventually showed:

```text
HTTP Server Listen address=[::]:3000 protocol=http
```

which confirms Grafana itself was listening on port 3000 inside the container.

## Lesson

Do not confuse:

```text
Grafana listens on :3000 inside container
```

with:

```text
PC can reach monitoring VM:3000
```

The second requires Docker port publishing **and** network/firewall reachability.

---

# 4. Grafana Container Logs Appearing to "Never End"

## Symptom

Running:

```bash
docker-compose up
```

produced continuous Grafana logs, apparently without ending.

The last lines repeatedly included requests such as:

```text
Request Completed method=GET path=/api/live/ws status=401
errorReason=Unauthorized
errorMessageId=session.token.rotate
error="token needs to be rotated"
```

Other startup lines included:

```text
Plugin registered
Plugins loaded
HTTP Server Listen address=[::]:3000
Starting scheduler
```

## Important clarification

This was **not necessarily a container failure**.

Running:

```bash
docker-compose up
```

without `-d` attaches the terminal to the containers and continuously displays their logs.

That is normal for a long-running service.

## Correct background mode

Use:

```bash
docker-compose up -d
```

Then check logs separately:

```bash
docker-compose logs -f grafana
```

or:

```bash
docker logs -f grafana
```

## About the repeated 401 `/api/live/ws`

The browser/Grafana Live WebSocket was generating:

```text
/api/live/ws
status=401
token needs to be rotated
```

This did not prevent the Grafana web interface/dashboard from working.

The key distinction is:

- container startup logs continuing = normal for foreground mode
- Grafana UI inaccessible = actual connectivity/configuration issue
- repeated Live WebSocket 401 = separate authentication/session issue

## Provisioning warnings seen

Logs also showed:

```text
Failed to read plugin provisioning files from directory
/etc/grafana/provisioning/plugins
```

and:

```text
Can't read alerting provisioning files from directory
/etc/grafana/provisioning/alerting
```

These were not the cause of the dashboard's missing Prometheus data. The dashboard itself could load.

---

# 5. Grafana Dashboard Worked but Some Panels Showed "No Data"

## Symptom

The dashboard loaded correctly.

Some panels worked:

- CPU
- RAM
- disk
- network
- other basic Node Exporter metrics

Other panels showed:

```text
No data
```

This happened even though Prometheus was scraping the VM.

## Important diagnostic principle

A panel showing no data does **not automatically mean Prometheus scraping is broken**.

If this works:

```promql
up{job="node"}
```

and returns:

```text
1
```

for the instance, then Prometheus can scrape Node Exporter.

The next question is whether the **specific metric exists** on that VM.

---

# 6. Grafana `$instance` Variable Problem

## Symptom

Queries containing:

```promql
job="node", instance="$instance"
```

initially returned no data in some cases.

The Prometheus metrics themselves clearly contained labels such as:

```text
node_cpu_seconds_total{
  cpu="0",
  instance="192.168.28.129:9100",
  job="node",
  mode="idle"
}
```

## Working variable concept

The Grafana variable was based on:

```promql
label_values(node_cpu_seconds_total, instance)
```

with:

```text
includeAll = true
multi = true
```

and a regex targeting Node Exporter instances:

```text
/.*:9100/
```

## Important distinction: `=` vs `=~`

For a variable that can contain **one value**, this is appropriate:

```promql
instance="$instance"
```

For a variable configured with **multi-select / All**, use:

```promql
instance=~"$instance"
```

because Grafana can expand the variable into a regular-expression-compatible value.

### Rule established during the project

Use:

```promql
instance=~"$instance"
```

for the dynamic multi-value `$instance` variable.

Use:

```promql
instance="$instance"
```

only when deliberately restricting the variable to one exact value.

## Example

Working pattern:

```promql
node_memory_MemTotal_bytes{job="node",instance=~"$instance"}
```

---

# 7. Two VMs and the "All" Instance Selector

## Concern

With two monitored VMs, selecting:

```text
All
```

can cause graphs to display both VMs.

The question was how to distinguish them.

## Solution

The Grafana variable should not be interpreted as "one graph per VM automatically."

Instead:

- `$instance` filters the metrics.
- `legendFormat` identifies the individual time series.
- Selecting one instance isolates that VM.
- Selecting All allows multiple instances to appear together.

For example:

```text
legendFormat = {{instance}}
```

or a more useful label:

```text
legendFormat = {{instance}} - {{device}}
```

depending on the panel.

## Dynamic scaling requirement

The project must not hard-code:

```text
VM1
VM2
VM3
```

in the dashboard.

When a new VM is added, the dashboard variable should discover it from Prometheus labels.

---

# 8. Dynamic VM Addition

## Intended workflow

The project uses:

```text
vm_list.txt
```

to maintain the monitored VM addresses.

When adding a VM:

1. Install/run Node Exporter on the new VM.
2. Ensure port 9100 is reachable from the monitoring VM.
3. Add the new VM IP/hostname to `vm_list.txt`.
4. Run:

```bash
./generate-prometheus-config.sh
```

5. Reload/restart Prometheus.

The dashboard's `$instance` variable then discovers the new instance from Prometheus.

## Important architectural lesson

Do not create a new Grafana dashboard for every VM.

The desired design is:

```text
One reusable dashboard
        +
Dynamic instance variable
        +
Prometheus target list
```

This scales much better.

---

# 9. Dashboard Datasource UID Problem

## Symptom

A dashboard exported from one Grafana environment contained a datasource UID such as:

```json
"uid": "PBFA97CFB590B2093"
```

The concern was that another person importing the JSON would not have that same UID.

## Cause

Grafana datasource UIDs are environment-specific identifiers.

A dashboard JSON can therefore contain references to a datasource that exists in the original Grafana instance but not in another one.

## Fix/design principle

The project should provision the Prometheus datasource through:

```text
grafana/provisioning/datasources/prometheus-datasource.yml
```

using a stable project-level datasource configuration.

The dashboard should avoid relying on a hard-coded UID generated by a developer's personal Grafana installation.

## General rule for portable dashboards

Do not assume:

```text
"My Grafana datasource UID"
```

exists on another machine.

The dashboard and datasource provisioning must be designed together.

---

# 10. Exported GitHub Dashboard `__inputs` Section

A downloaded/imported dashboard contained sections like:

```json
"__inputs": [
  {
    "name": "DS_PROMETHEUS",
    "label": "prometheus",
    "type": "datasource",
    "pluginId": "prometheus",
    "pluginName": "Prometheus"
  }
]
```

and:

```json
"__requires": [...]
```

## Important lesson

`__inputs` is commonly present in dashboards exported for import workflows.

It is not itself proof that the dashboard is broken.

The real issue to inspect is how individual panels reference their datasource and whether the datasource exists in the destination Grafana.

Similarly, `__requires` describes Grafana/panel/plugin requirements. It is useful metadata, but it does not magically configure the destination datasource.

---

# 11. Imported Advanced Node Exporter Dashboard

A more advanced Node Exporter dashboard was imported for testing.

Example query:

```promql
irate(node_pressure_io_waiting_seconds_total{instance="$node",job="$job"}[$__rate_interval])
```

The dashboard used variables such as:

```text
$node
$job
```

whereas the project's own dashboard used:

```text
$instance
```

## Lesson

Dashboard variable names are not standardized across all dashboards.

A dashboard imported from GitHub may expect:

```text
$node
$job
$diskdevices
```

while the project's dashboard expects:

```text
$instance
```

Before importing a dashboard, inspect:

1. `templating.list`
2. every query's variables
3. datasource references
4. required collectors/metrics
5. Grafana version/plugin requirements

---

# 12. Disk Device Variable Problem

## Symptom

A disk I/O panel used:

```promql
irate(
  node_disk_read_bytes_total{
    instance=~"$instance",
    job="node",
    device=~"$diskdevices"
  }[$__rate_interval]
)
```

The panel showed no data.

## Meaning of `$diskdevices`

`$diskdevices` does **not** mean the VM itself.

It means the **block storage devices exposed by Node Exporter**, for example:

```text
sda
sdb
vda
nvme0n1
```

depending on the VM/hypervisor/storage configuration.

## Diagnostic principle

First query:

```promql
node_disk_read_bytes_total{instance=~"$instance",job="node"}
```

If this returns data, the underlying metric exists.

Then inspect the `device` labels.

If `$diskdevices` is incorrectly defined or filters out the available device names, the panel will show no data.

## Dashboard design decision

The user wanted:

1. one dashboard without disk-device variable
2. another version with a disk-device variable

This is a good separation because not every panel needs a device selector.

---

# 13. Device Variable Should Be Dynamic

A robust disk-device Grafana variable should discover devices from Prometheus rather than hard-code:

```text
sda
sdb
```

because virtualization environments may expose:

```text
sda
vda
xvda
nvme0n1
```

etc.

The upgraded project should derive the variable from a metric label, rather than assuming a particular disk naming scheme.

---

# 14. Panels That Worked vs Panels That Did Not

The following queries were explicitly observed to show no data on at least one VM/WSL environment:

```promql
node_processes_state{instance=~"$instance",job="node"}
```

```promql
node_processes_pids{instance=~"$instance",job="node"}
```

```promql
node_processes_threads{instance=~"$instance",job="node"}
```

```promql
node_cpu_scaling_frequency_hertz{instance=~"$instance",job="node"}
```

```promql
irate(node_interrupts_total{instance=~"$instance",job="node"}[$__rate_interval])
```

```promql
node_hwmon_fan_rpm{instance=~"$instance",job="node"}
* on(chip) group_left(chip_name)
node_hwmon_chip_names{instance=~"$instance",job="node"}
```

```promql
node_systemd_units{
  instance=~"$instance",
  job="node",
  state="activating"
}
```

```promql
node_systemd_socket_current_connections{
  instance=~"$instance",
  job="node"
}
```

```promql
irate(
  node_systemd_socket_accepted_connections_total{
    instance=~"$instance",
    job="node"
  }[$__rate_interval]
)
```

```promql
irate(
  node_systemd_socket_refused_connections_total{
    instance=~"$instance",
    job="node"
  }[$__rate_interval]
)
```

## Important observation

Other CPU, RAM, disk-space and network panels worked.

Therefore:

> A dashboard panel returning no data can be caused by the monitored operating system, VM environment, kernel, Node Exporter collector availability, or the exact metric labels — not necessarily by Grafana or Prometheus.

---

# 15. Why Some Node Exporter Metrics Are Missing on VMs

Some metrics are environment-dependent.

## Hardware monitoring

Metrics such as:

```text
node_hwmon_fan_rpm
node_hwmon_chip_names
```

depend on hardware sensors being exposed.

A VM usually does not have direct access to the physical host's fan sensors.

Therefore:

```text
VM → no physical fan sensor → no node_hwmon_fan_rpm
```

is expected.

## Systemd metrics

Metrics such as:

```text
node_systemd_units
node_systemd_socket_current_connections
```

depend on systemd information being available and the corresponding collector being able to access it.

Minimal images, containers, WSL and some VM configurations may not provide the same information.

## CPU frequency

Metrics such as:

```text
node_cpu_scaling_frequency_hertz
```

depend on CPU frequency/scaling information exposed by the kernel.

A VM may not expose the same CPU frequency controls as bare metal.

## Processes / interrupts

Metrics such as:

```text
node_processes_*
node_interrupts_total
```

can depend on how Node Exporter is running and what `/proc`/host namespaces it can see.

---

# 16. Node Exporter Docker Deployment

The original known-working command was:

```bash
docker run -d \
  --name node_exporter \
  -p 9100:9100 \
  --restart unless-stopped \
  prom/node-exporter
```

This successfully exposed basic Node Exporter metrics.

## More advanced attempted command

To expose more host-level information, the project experimented with:

```bash
docker run -d \
  --name node_exporter \
  --pid=host \
  --net=host \
  --privileged \
  --restart unless-stopped \
  -v "/:/host:ro,rslave" \
  prom/node-exporter \
  --path.rootfs=/host
```

Additional collectors were also considered:

```text
--collector.systemd
--collector.hwmon
--collector.processes
--collector.interrupts
--collector.netstat
--collector.cpu
```

## Critical upgrade-agent lesson

Do not blindly enable every collector.

First determine:

- whether the metric exists on the target OS
- whether the collector is supported
- whether the collector requires host namespaces
- whether the VM actually exposes the underlying information
- whether the additional privileges are acceptable

For a production deployment, least privilege should be preferred.

---

# 17. Docker `rslave` Mount Error on Ubuntu VM

## Symptom

The advanced Node Exporter command failed with:

```text
docker: Error response from daemon:
path / is mounted on / but it is not a shared or slave mount.
```

The container remained in a `created` state and port mapping was not active.

## Diagnostic command

The root mount propagation was checked with:

```bash
findmnt -o TARGET,PROPAGATION /
```

The result was:

```text
TARGET PROPAGATION
/      shared
```

## Important lesson

If `/` already reports:

```text
shared
```

then the error is not explained by `/` being private.

Do not immediately modify mount propagation.

Instead inspect:

```bash
docker logs node_exporter
docker ps -a
docker inspect node_exporter
findmnt -o TARGET,PROPAGATION /
```

and test the simple Node Exporter command.

## Confirmed behavior

The simple command without the root bind mount worked:

```bash
docker run -d \
  --name node_exporter_simple \
  -p 9100:9100 \
  --restart unless-stopped \
  prom/node-exporter
```

This established that:

- Docker worked
- Node Exporter worked
- port 9100 worked
- the advanced host-root mount was the area requiring diagnosis

---

# 18. WSL Node Exporter Testing

Node Exporter was also tested in Linux WSL.

## Important limitation

WSL is not equivalent to a normal Linux VM or bare-metal Linux server.

Some host-level metrics may not exist or may not be exposed in the same way.

This explains why a dashboard can show:

```text
CPU → data
RAM → data
basic disk → data
```

but:

```text
hardware sensors → no data
systemd-dependent metrics → possibly no data
```

## Lesson for the upgraded project

WSL should be treated as a development/test environment, not as proof that every Node Exporter collector will work on an enterprise Linux VM.

For an Orange Maroc-style deployment target, testing should prioritize actual supported Linux distributions used by the target environment, especially Red Hat-family systems if that is the deployment requirement.

---

# 19. Root Filesystem Usage Query Worked on One VM but Not Another

The query:

```promql
(
  (
    node_filesystem_size_bytes{
      instance=~"$instance",
      job="node",
      mountpoint="/",
      fstype!="rootfs"
    }
    -
    node_filesystem_avail_bytes{
      instance=~"$instance",
      job="node",
      mountpoint="/",
      fstype!="rootfs"
    }
  )
  /
  node_filesystem_size_bytes{
    instance=~"$instance",
    job="node",
    mountpoint="/",
    fstype!="rootfs"
  }
) * 100
```

worked on one VM but returned no data on another VM and WSL.

## Diagnosis principle

The query requires a time series matching all of:

```text
mountpoint="/"
fstype!="rootfs"
job="node"
instance=<selected instance>
```

If the target does not expose a matching filesystem series, the query returns no data.

## Correct diagnostic sequence

Start broad:

```promql
node_filesystem_size_bytes{instance=~"$instance",job="node"}
```

Then inspect:

```text
mountpoint
fstype
device
```

Then test:

```promql
node_filesystem_size_bytes{
  instance="TARGET:9100",
  mountpoint="/"
}
```

Only after confirming the labels should the filter:

```text
fstype!="rootfs"
```

be applied.

## Lesson

Never assume all Linux distributions/VM storage layouts expose identical filesystem labels.

---

# 20. VM Networking — VMware Workstation NAT

The project used VMware Workstation VMs with NAT networking.

Example topology:

```text
Host PC
   |
 VMware NAT
   |
   +-- Monitoring VM   192.168.28.128
   |
   +-- Client VM 1     192.168.28.129
   |
   +-- Client VM 2     192.168.28.130
```

## Important networking clarification

NAT does not mean the VMs have no private IP addresses.

Each VM receives a private IP on the virtual NAT network.

The host/NAT device provides the route toward external networks.

For this project, Prometheus communicates directly with the monitored VM's private address:

```text
http://192.168.28.129:9100/metrics
```

The traffic does not need to go through the public Internet.

## Requirement

The monitoring VM must be able to reach the monitored VM on TCP port:

```text
9100
```

A useful test is:

```bash
curl http://<VM_IP>:9100/metrics
```

---

# 21. VMware Network Modes Considered

## NAT

Valid for the project.

Good for a lab because:

- VMs can communicate on the private virtual network
- VMs can normally access external networks through NAT
- Prometheus can scrape private VM addresses

## Host-Only

Also valid.

Useful when:

- only VM-to-VM and host-to-VM communication is needed
- Internet access is not required

Potential inconvenience:

- Docker image downloads/package installation may require another network adapter or temporary Internet connectivity.

## Bridged

Valid.

Makes VMs appear directly on the physical LAN.

Useful when:

- other physical machines need to access Grafana
- the lab should behave more like machines on a real LAN

## LAN Segment

Possible for isolated multi-VM network labs, but not necessary for the basic monitoring architecture.

---

# 22. Host Does Not Need to Be Monitored

The host PC is not part of the Prometheus target list.

That is completely valid.

The monitoring topology is:

```text
Monitoring VM
    |
    +--> Client VM 1
    |
    +--> Client VM 2
    |
    +--> Client VM 3
```

The physical Windows host is simply running VMware Workstation.

It does not have to be a monitored target.

---

# 23. Linked Clones

Linked clones were considered as an alternative to manually creating separate client VMs.

## Conclusion

Linked clones can work for this project.

Prometheus does not care whether a VM was created as:

- an independent VM
- a linked clone
- another virtual-machine template

What matters is that every running VM has a unique network identity and exposes Node Exporter.

## Important clone requirements

Each clone should have:

- a unique IP address
- preferably a unique hostname
- a unique machine identity where appropriate
- its own working Node Exporter service/container

If a clone accidentally uses the same IP as its parent, Prometheus cannot treat both as separate targets.

---

# 24. Node Exporter: App, Service or API?

This question came up during the project.

## What Node Exporter actually is

Node Exporter is a monitoring agent/exporter.

It runs as a process/service on the monitored Linux machine.

In this project it is deployed as a Docker container:

```bash
docker run ...
```

So conceptually:

```text
Linux VM
   |
   +-- Docker
        |
        +-- node_exporter container
```

The container is not the monitored VM itself. It is the agent that reads system metrics and exposes them.

## HTTP endpoint

Node Exporter exposes:

```text
http://<VM_IP>:9100/metrics
```

Prometheus periodically requests this endpoint.

---

# 25. APIs in This Project

The project does not contain a custom API written by the developer.

However, it uses HTTP interfaces/APIs provided by the monitoring tools.

## Node Exporter

Exposes:

```text
GET http://<vm-ip>:9100/metrics
```

Prometheus consumes this endpoint.

## Prometheus

Prometheus exposes HTTP APIs including query endpoints.

Grafana uses Prometheus to retrieve time-series data.

Conceptually:

```text
Node Exporter
      |
      | HTTP metrics endpoint
      ▼
Prometheus
      |
      | HTTP query/API
      ▼
Grafana
```

## Grafana

Grafana also provides APIs, but the project primarily configures Grafana through provisioning files rather than developing a custom Grafana REST API integration.

---

# 26. Important API Explanation for Handoff

Do not tell an AI agent:

> "We developed an API."

That is inaccurate.

Correct statement:

> "The project consumes the standard HTTP interfaces exposed by Node Exporter and Prometheus. No custom application API was developed."

---

# 27. Dashboard Portability Problems

The original working dashboard was exported from the developer's Grafana environment.

Potential portability problems identified:

## Hard-coded datasource UID

Example:

```json
"uid": "PBFA97CFB590B2093"
```

This UID can differ on another Grafana installation.

## Hard-coded instance links

A dashboard export also contained a link referring to a specific instance:

```text
192.168.28.129:9100
```

That should not be hard-coded into a reusable dashboard.

## Dashboard ID / UID

Grafana dashboards can contain:

```json
"id": ...
```

and:

```json
"uid": ...
```

The UID should not be treated as the developer's machine identity.

For a reusable project, dashboard provisioning/import behavior should be designed intentionally.

## Lesson

A dashboard exported from a personal Grafana environment should be cleaned before committing to GitHub.

---

# 28. `instance="$instance"` vs `instance=~"$instance"`

This was one of the most important recurring dashboard issues.

## Exact match

```promql
instance="$instance"
```

means:

```text
instance exactly equals the selected value
```

## Regex match

```promql
instance=~"$instance"
```

means:

```text
instance matches the regex produced by the variable
```

This is important for:

```text
Multi = true
Include All = true
```

## Recommended project convention

For the project's dynamic `$instance` variable:

```promql
instance=~"$instance"
```

should generally be used.

---

# 29. Dashboard "All" Selection

If:

```text
$instance = All
```

then queries using:

```promql
instance=~"$instance"
```

can match all monitored Node Exporter instances.

This is intentional.

The dashboard should use legends such as:

```text
{{instance}}
```

when multiple VMs can appear on the same panel.

Alternatively, users can select a single instance when they want a clean per-VM view.

---

# 30. Important Dashboard Design Lesson

The dashboard should be designed around:

```text
Dynamic infrastructure
```

not:

```text
Developer's current VMs
```

Avoid:

```text
192.168.28.129
192.168.28.130
```

inside individual queries.

Prefer:

```promql
instance=~"$instance"
```

and dynamic variables.

Avoid fixed device names where possible.

---

# 31. GitHub Portability Requirement

The project is intended to be pushed to GitHub and deployed by another person.

Therefore the upgraded project should assume:

```text
Developer machine ≠ deployment machine
```

The project must not depend on:

- developer's IP
- developer's datasource UID
- developer's Grafana dashboard ID
- developer's VM names
- developer's disk names
- developer's filesystem layout
- developer's WSL behavior

---

# 32. Red Hat / Enterprise Deployment Considerations

The project was intended for eventual delivery/testing in an environment using Red Hat Linux.

The project was initially developed/tested using Ubuntu Linux VMs.

## Important lesson

Do not assume:

```text
Ubuntu metrics = Red Hat metrics
```

The same Node Exporter metric families are generally expected where supported, but:

- filesystem layouts can differ
- service management can differ
- SELinux can affect deployment
- firewall configuration can differ
- device names can differ
- hardware visibility differs
- kernel features can differ

The deployment documentation should therefore include validation commands rather than assuming every advanced panel will always have data.

---

# 33. Node Exporter Port

The standard project port is:

```text
9100
```

Docker mapping:

```yaml
-p 9100:9100
```

Prometheus targets should therefore use:

```text
<VM_IP>:9100
```

The monitored VM firewall must permit Prometheus/monitoring VM access to TCP 9100.

For enterprise deployment, access to 9100 should ideally be restricted to the monitoring server/network rather than exposing it broadly.

---

# 34. Prometheus Target Validation

When adding/troubleshooting a VM, use this sequence.

## Step 1 — Test Node Exporter locally on monitored VM

```bash
curl http://localhost:9100/metrics
```

## Step 2 — Test from monitoring VM

```bash
curl http://<VM_IP>:9100/metrics
```

## Step 3 — Check Prometheus target health

Query:

```promql
up{job="node"}
```

Expected:

```text
1
```

for each healthy target.

## Step 4 — Check the actual metric

Example:

```promql
node_cpu_seconds_total{job="node"}
```

## Step 5 — Inspect labels

For filesystem:

```promql
node_filesystem_size_bytes{job="node"}
```

For disk:

```promql
node_disk_read_bytes_total{job="node"}
```

For CPU:

```promql
node_cpu_seconds_total{job="node"}
```

Only after confirming the raw metric exists should a complex dashboard query be debugged.

---

# 35. General Dashboard Troubleshooting Procedure

When a panel shows "No data":

### Step 1

Remove variables:

```promql
metric_name
```

### Step 2

Add job:

```promql
metric_name{job="node"}
```

### Step 3

Add instance:

```promql
metric_name{job="node",instance="TARGET:9100"}
```

### Step 4

Inspect all labels.

### Step 5

Add Grafana variable:

```promql
instance=~"$instance"
```

### Step 6

Only then add optional filters such as:

```text
device
mountpoint
fstype
state
mode
```

This prevents a complex selector from hiding the real cause.

---

# 36. PromQL Query Pitfall: Metrics Can Exist but Still Match Nothing

Example:

```promql
node_filesystem_size_bytes{
  mountpoint="/",
  fstype!="rootfs"
}
```

The metric family may exist, but the exact combination of labels may not.

Therefore:

```text
Metric exists
```

does NOT imply:

```text
This exact query returns data
```

The upgraded dashboard should avoid unnecessarily restrictive selectors.

---

# 37. Advanced Collector Strategy

The initial goal was to make every advanced dashboard panel work by enabling more Node Exporter collectors.

The upgraded project should instead use a more robust philosophy:

## Core metrics

Guarantee/document:

- CPU
- RAM
- filesystem
- disk
- network
- uptime/basic system metrics

## Optional metrics

Treat these as environment-dependent:

- hwmon
- fan sensors
- systemd
- CPU frequency
- specialized kernel metrics

The dashboard should gracefully handle missing optional metrics.

---

# 38. What Not to Do in the Upgrade

Avoid designing the new project around these assumptions:

```text
Every Linux VM has the same metrics
```

```text
Every VM exposes physical hardware sensors
```

```text
Every VM uses systemd in the same way
```

```text
Every VM uses / as the same filesystem type
```

```text
Every VM calls its disk sda
```

```text
Every Grafana installation has the same datasource UID
```

```text
Every user has the same IP addresses
```

```text
Every Grafana version behaves identically
```

---

# 39. Recommended Upgrade Architecture

The next version should aim for:

```text
                 GitHub Repository
                         |
                         ▼
             Monitoring VM deployment
                         |
              ┌──────────┴──────────┐
              ▼                     ▼
          Prometheus              Grafana
              │                     │
              │                     │
              └──────────┬──────────┘
                         │
                  Dynamic variables
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       VM/client       VM/client       VM/client
       Node Exporter   Node Exporter   Node Exporter
```

Configuration:

```text
vm_list.txt
     ↓
generate-prometheus-config.sh
     ↓
prometheus.yml
     ↓
Prometheus
```

Dashboard:

```text
Prometheus datasource
        ↓
Dynamic instance variable
        ↓
Reusable dashboard
```

---

# 40. Deployment Checklist — Monitoring VM

After cloning/pulling the repository:

```bash
git clone <repository>
cd monitoring-project
```

Check:

```bash
docker --version
docker compose version
```

Populate:

```text
vm_list.txt
```

Generate Prometheus config:

```bash
./generate-prometheus-config.sh
```

Validate the generated file:

```bash
cat prometheus/prometheus.yml
```

Start:

```bash
docker compose up -d
```

Check:

```bash
docker ps
```

Check logs:

```bash
docker compose logs -f prometheus
docker compose logs -f grafana
```

Test Prometheus:

```text
http://<monitoring-vm-ip>:9090
```

Test Grafana:

```text
http://<monitoring-vm-ip>:3000
```

---

# 41. Deployment Checklist — Monitored VM

Install Docker if Docker deployment is the chosen method.

Run Node Exporter:

```bash
docker run -d \
  --name node_exporter \
  -p 9100:9100 \
  --restart unless-stopped \
  prom/node-exporter
```

Verify:

```bash
docker ps
```

Test locally:

```bash
curl http://localhost:9100/metrics
```

Test from monitoring VM:

```bash
curl http://<VM_IP>:9100/metrics
```

Then add:

```text
<VM_IP>
```

to:

```text
vm_list.txt
```

and regenerate Prometheus configuration.

---

# 42. New VM Checklist

When VM4 is created:

```text
1. Start VM4
2. Give VM4 a unique IP
3. Give VM4 a unique hostname
4. Install/run Node Exporter
5. Verify localhost:9100/metrics
6. Verify monitoring VM can reach VM4:9100
7. Add VM4 IP to vm_list.txt
8. Run generate-prometheus-config.sh
9. Reload/restart Prometheus
10. Verify up{job="node"}
11. Open Grafana
12. Verify VM4 appears in $instance
```

No new Grafana dashboard should be required.

---

# 43. Key Lessons for the AI Upgrade Agent

## Lesson 1

The monitoring stack is fundamentally:

```text
Node Exporter → Prometheus → Grafana
```

## Lesson 2

Node Exporter is deployed on every monitored VM.

## Lesson 3

Prometheus is deployed on the monitoring VM.

## Lesson 4

Grafana queries Prometheus; Grafana does not need to query every VM directly.

## Lesson 5

The dashboard must be portable.

Never hard-code:

```text
developer IP
developer datasource UID
developer disk
developer VM count
```

## Lesson 6

Use dynamic Grafana variables.

## Lesson 7

Use:

```promql
instance=~"$instance"
```

for the project's multi-select/All instance variable.

## Lesson 8

Missing data can be a legitimate property of the monitored environment.

## Lesson 9

A VM is not a physical machine. Hardware-specific metrics may not exist.

## Lesson 10

WSL is not a perfect substitute for a real Linux VM.

## Lesson 11

A successful:

```promql
up{job="node"}
```

only proves scraping works. It does not prove every metric exists.

## Lesson 12

Debug PromQL progressively from:

```promql
metric
```

to:

```promql
metric{job="node"}
```

to:

```promql
metric{job="node",instance="TARGET:9100"}
```

then add other labels.

## Lesson 13

Extra Node Exporter privileges should be justified, not blindly enabled.

## Lesson 14

For enterprise deployment, firewall rules should restrict port 9100 to the monitoring infrastructure.

## Lesson 15

Test on the target Linux distribution instead of relying only on Ubuntu/WSL.

---

# 44. Compact Incident Table

| Problem | Cause/Area | Fix/Lesson |
|---|---|---|
| Grafana browser inaccessible | Connectivity/port/container state | Verify container, `3000:3000`, VM networking and firewall |
| `curl localhost:3000` failed | Grafana/container not reachable at that point | Check `docker ps`, logs and published port |
| `docker compose up` appeared endless | Foreground mode continuously streams logs | Use `docker compose up -d`; use `logs -f` separately |
| Grafana Live `/api/live/ws` 401 | Session/token rotation | Separate from normal container startup; dashboard could still work |
| Some panels had no data | Metric/label/environment differences | Test raw metric before debugging dashboard |
| `$instance` panels had no data | Variable matching/configuration | Dynamic multi-value variable + `instance=~"$instance"` |
| `instance="$instance"` issue | Exact match unsuitable for multi/All | Prefer `=~` for multi-select variable |
| Disk panel no data with `$diskdevices` | Device variable/filter mismatch | Inspect actual `device` labels dynamically |
| Imported dashboard not portable | Datasource UID / hard-coded references | Provision datasource; avoid developer-specific UIDs |
| GitHub dashboard used `$node/$job` | Different variable conventions | Adapt templating and queries |
| Advanced metrics missing | Optional collectors/environment | Treat hardware/systemd/frequency metrics as environment-dependent |
| Root filesystem query missing data | Different `mountpoint`/`fstype` labels | Inspect raw filesystem labels first |
| Advanced Node Exporter Docker command failed | Root mount propagation/bind-mount setup | Diagnose mount state; simple container proved Node Exporter itself worked |
| Ubuntu root propagation showed `shared` | Root was not private | Do not modify propagation blindly; investigate exact Docker mount error |
| WSL missing advanced metrics | WSL limitations | Use real Linux VM for validation |
| NAT concerns | Misunderstanding private VM networking | NAT VMs still communicate using private IPs |
| Host not monitored | Not part of target list | Completely valid architecture |
| Linked clones considered | VM duplication strategy | Valid if each clone gets unique identity/networking |
| Dashboard hard-coded instance link | Exported personal environment | Remove environment-specific links |
| Two VMs with All selection | Multiple time series | Use instance in legend or select one instance |
| New VM integration | Static target management | Add IP to `vm_list.txt`, regenerate config, reload Prometheus |

---

# 45. Final Handoff Principle

The biggest lesson from the project is:

> **Monitoring software should be designed around the infrastructure's variability, not around the developer's current machine.**

The upgraded implementation should therefore prioritize:

```text
Dynamic targets
Dynamic Grafana variables
Portable datasource configuration
Environment-aware collectors
Graceful handling of unavailable metrics
Minimal hard-coded infrastructure information
Clear diagnostics
Secure network exposure
Red Hat/Linux compatibility
```

The original project proved the core pipeline works:

```text
Linux VM
  ↓
Node Exporter :9100
  ↓
Prometheus
  ↓
Grafana
  ↓
Dynamic dashboard
```

The next version should preserve that working core while making deployment, discovery, dashboard portability, diagnostics, security and cross-distribution compatibility significantly more robust.
