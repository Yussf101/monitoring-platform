#!/usr/bin/env python3
"""
Dynamic Ansible inventory for the monitoring platform.

Queries the FastAPI backend to discover which targets should be provisioned.
Eliminates the manual vm_list.txt editing from the v1 monitoring project.

Usage by Ansible:
    ansible-playbook -i inventory/dynamic_inventory.py site.yml

Environment variables:
    MONITORING_API_URL — Backend API base URL (default: http://backend:8000)
"""

import os
import sys
import json
import requests

API_URL = os.environ.get("MONITORING_API_URL", "http://backend:8000")

def get_inventory():
    empty_inventory = {"_meta": {"hostvars": {}}}
    
    try:
        response = requests.get(f"{API_URL}/api/targets", timeout=5)
        response.raise_for_status()
        targets = response.json()
    except Exception as e:
        sys.stderr.write(f"Error connecting to monitoring API at {API_URL}: {e}\n")
        return empty_inventory

    inventory = {
        "targets": {
            "hosts": {}
        },
        "_meta": {
            "hostvars": {}
        }
    }

    for target in targets:
        if not target.get("is_active", False):
            continue

        hostname = target["name"]
        
        # Add to 'targets' group
        if isinstance(inventory["targets"]["hosts"], list):
             # Some inventory formats use lists, some use dicts for hosts.
             # Ansible accepts a list or dict. We'll use list for the group.
             pass 
        else:
             inventory["targets"]["hosts"] = []
        
        if hostname not in inventory["targets"]["hosts"]:
            inventory["targets"]["hosts"].append(hostname)
        
        # Add host variables to _meta
        inventory["_meta"]["hostvars"][hostname] = {
            "ansible_host": target["ip_address"],
            "ansible_user": target.get("ssh_user", "youssef"),
            "node_exporter_port": target["port"]
        }

    # If hosts is still a dict because no active targets were found, make it an empty list
    if isinstance(inventory["targets"]["hosts"], dict):
         inventory["targets"]["hosts"] = []

    return inventory

if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == '--list':
        print(json.dumps(get_inventory(), indent=2))
    elif len(sys.argv) == 3 and sys.argv[1] == '--host':
        # --list already returns _meta.hostvars, so Ansible rarely calls --host.
        # Returning empty dict is standard practice when _meta is used.
        print(json.dumps({}))
    else:
        sys.stderr.write("Usage: {} --list\n".format(sys.argv[0]))
        sys.exit(1)
