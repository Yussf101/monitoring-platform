FROM python:3.12-slim

# Install Ansible + SSH client
RUN pip install --no-cache-dir ansible requests && \
    apt-get update && apt-get install -y --no-install-recommends \
        openssh-client sshpass && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /ansible

# Copy the entire Ansible project
COPY . .

# Make inventory script executable
RUN chmod +x inventory/dynamic_inventory.py

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Default command: run the site playbook
ENTRYPOINT ["/entrypoint.sh"]
CMD ["site.yml"]
