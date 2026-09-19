# Ansible Infrastructure Automation - Complete Guide

This guide will walk you through the entire end-to-end process of testing Phase 2. You will set up SSH access from your Windows machine to your Linux VMs (Ubuntu & Fedora), register them in the monitoring platform's database, and use Docker to automatically install Node Exporter via Ansible.

---

## Step 1: Prepare Your Virtual Machines

Before automating anything, we need to make sure the VMs are ready to be communicated with.

1.  **Start both VMs** (Ubuntu and Fedora) in VMware.
2.  **Find their IP Addresses:**
    *   Log into each VM's terminal.
    *   Run the command: `ip a` (or `ifconfig`).
    *   Look for the IP address (usually starts with `192.168.` or `10.0.`).
    *   *Write these down! We will need them.*
3.  **Ensure SSH is installed and running:**
    *   **Ubuntu:** Run `sudo apt update && sudo apt install -y openssh-server`
    *   **Fedora:** Run `sudo dnf install -y openssh-server && sudo systemctl enable --now sshd`
4.  **Allow Passwordless Sudo (Crucial for Ansible):**
    Ansible needs to run commands as `root` to install services. To prevent it from hanging while asking for a password:
    *   On both VMs, run: `sudo visudo`
    *   Scroll to the bottom of the file and add this line (replace `your_username` with your actual username, e.g., `youssef`):
        ```text
        your_username ALL=(ALL) NOPASSWD:ALL
        ```
    *   Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 2: Set Up SSH Keys on Windows

Ansible (running inside Docker) will mount your Windows `~/.ssh` folder so it can securely log into the VMs without passwords.

1.  **Open PowerShell on your Windows machine.**
2.  **Generate an SSH Keypair:**
    ```powershell
    ssh-keygen -t ed25519 -C "monitoring-platform"
    ```
    *Press **Enter** for every prompt to accept the default location (`C:\Users\YourName\.ssh\id_ed25519`) and leave the passphrase empty.*

3.  **Copy the Public Key to the Ubuntu VM:**
    Run these exact commands in PowerShell, replacing `youssef` and `192.168.1.100` with your Ubuntu VM's username and IP:
    ```powershell
    $pubKey = Get-Content ~/.ssh/id_ed25519.pub
    ssh youssef@192.168.1.100 "mkdir -p ~/.ssh && echo `"$pubKey`" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
    ```
    *It will ask for your VM's password one last time.*

4.  **Copy the Public Key to the Fedora VM:**
    Repeat the same command for your Fedora VM:
    ```powershell
    ssh youssef@192.168.1.101 "mkdir -p ~/.ssh && echo `"$pubKey`" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
    ```

5.  **Verify the Connection:**
    Try logging in from PowerShell:
    ```powershell
    ssh youssef@192.168.1.100
    ```
    *If it logs you right in without asking for a password, SSH is perfectly configured! Type `exit` to return to PowerShell.*

---

## Step 3: Register Targets in the Backend API

Now we need to tell our monitoring platform database about these VMs.

1.  Ensure your backend is running (`docker compose up -d db backend`).
2.  Open your browser and go to the Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
3.  Scroll down to the **POST /api/targets** endpoint.
4.  Click **"Try it out"**.
5.  Paste the following JSON for your **Ubuntu VM** (Update the values to match your VM):
    ```json
    {
      "name": "ubuntu-server",
      "ip_address": "192.168.1.100",
      "port": 9100,
      "os_type": "linux",
      "ssh_user": "youssef"
    }
    ```
6.  Click **Execute**. You should get a `200 OK` response.
7.  Repeat the process for your **Fedora VM**:
    ```json
    {
      "name": "fedora-server",
      "ip_address": "192.168.1.101",
      "port": 9100,
      "os_type": "linux",
      "ssh_user": "youssef"
    }
    ```

*(Alternatively, you can run `curl http://localhost:8000/api/targets` in PowerShell to verify both are in the database).*

---

## Step 4: Run the Ansible Provisioning

This is where the magic happens. We will run the Ansible Docker container, which will query the API, find your two VMs, and install Node Exporter on them simultaneously.

1.  Open PowerShell in the root of your project (`C:\Users\Youssef\Desktop\monitoring-platform-v2`).
2.  Run the Ansible container:
    ```powershell
    docker compose --profile provision run --rm ansible
    ```

3.  **What to expect:**
    You will see output that looks like this:
    ```text
    PLAY [Provision Node Exporter] ********************************************

    TASK [Gathering Facts] ****************************************************
    ok: [ubuntu-server]
    ok: [fedora-server]

    TASK [node_exporter : Download Node Exporter] *****************************
    changed: [ubuntu-server]
    changed: [fedora-server]

    ...

    PLAY RECAP ****************************************************************
    ubuntu-server  : ok=6  changed=4  unreachable=0  failed=0  skipped=0
    fedora-server  : ok=6  changed=4  unreachable=0  failed=0  skipped=0
    ```
    *As long as `failed=0` and `unreachable=0`, the installation was a success!*

---

## Step 5: Verify Node Exporter is Running

Let's prove that Ansible actually did its job. 

1.  Open your web browser.
2.  Navigate to your Ubuntu VM's metrics page: `http://192.168.1.100:9100/metrics`
3.  Navigate to your Fedora VM's metrics page: `http://192.168.1.101:9100/metrics`

If you see a massive page of text data starting with `# HELP go_gc_duration_seconds`, **Phase 2 is 100% successful!**

*(Bonus test: If you run Step 4 again, Ansible will report `changed=0` because it realizes Node Exporter is already installed and configured correctly. This is called idempotency).*
