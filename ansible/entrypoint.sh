#!/bin/bash
set -e

# Windows Docker mounts files with 0777 permissions which SSH strictly rejects.
# We mount the Windows keys to /mnt/ssh, copy them to /root/.ssh, and fix permissions.
mkdir -p /root/.ssh
if [ -d "/mnt/ssh" ]; then
    cp -R /mnt/ssh/* /root/.ssh/ 2>/dev/null || true
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/id_* /root/.ssh/*.pem 2>/dev/null || true
fi

# Disable interactive prompts for unknown SSH fingerprints
export ANSIBLE_HOST_KEY_CHECKING=False

# Execute the requested ansible-playbook command
exec ansible-playbook "$@"
