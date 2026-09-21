# Appointment App — Terraform + Ansible AWS Deployment

AWS only. You will create **3 Ubuntu EC2 machines**: 1 control node and 2 managed nodes. All Ansible commands run **on the control node**, not on your laptop.

| Name | Role | What runs here |
|------|------|----------------|
| `control` | Ansible master | Install Ansible, copy the `.pem`, run playbooks |
| `web1` | Managed node | Nginx (TLS termination + reverse proxy) + the app's Docker containers, pulled from GHCR |
| `db1` | Managed node | Self-hosted MongoDB + nightly backups |

Same SSH key on all three. Port **22** open on `control` from your IP only; `web1`/`db1` are only reachable inside the VPC. Ports **80**/**443** open on `web1` for the demo.

This is a companion to [`../deployment/AWS.md`](../deployment/AWS.md)'s ECS/App Runner/EC2 paths — same app, deployed with real configuration management instead of managed container services, for the Ansible/Linux-ops side of the story.

---

## Prerequisites

On your **laptop**:

- An AWS account and an IAM user that can create VPC/EC2
- AWS CLI and Terraform (install commands below)
- This repository

On **AWS**:

- 3 × Ubuntu 22.04 EC2 (Terraform creates them — [`infra/terraform/aws-classroom/`](../infra/terraform/aws-classroom/))
- One key pair shared by all instances
- Security groups: SSH 22 on `control` from your IP; HTTP 80/443 on `web1`; `db1` has no public IP at all

**GHCR images must be pullable.** The `.github/workflows/ci.yml` `docker-publish` job already builds and pushes `appointment-backend`/`appointment-frontend` to GHCR on every merge to `main`. GHCR packages are **private by default** — either:
- make them public (repo → Packages → each package → Package settings → Change visibility), the simple default this guide assumes, or
- keep them private and set `ghcr_login_required: true` in `group_vars/all/main.yml`, plus `vault_ghcr_username`/`vault_ghcr_token` (a PAT with `read:packages`) in the vault.

---

## 1. Laptop — AWS CLI, Terraform, and an SSH key

```bash
sudo apt update
sudo apt install -y unzip curl git

curl -fsSL https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip -o /tmp/terraform.zip
sudo unzip -o /tmp/terraform.zip -d /usr/local/bin
terraform version

curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -o /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
aws --version
```

```bash
aws configure
aws sts get-caller-identity
```

Create the key that every instance will use:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/appointment-ec2 -C appointment-ec2 -N ""
chmod 400 ~/.ssh/appointment-ec2
```

Lock SSH to your current public IP:

```bash
curl -s https://checkip.amazonaws.com
```

---

## 2. Laptop — create the 3 EC2 machines

```bash
cd /media/hazrat/Hazrat4/Code/Node/appointment/infra/terraform/aws-classroom

cp example.tfvars terraform.tfvars
nano terraform.tfvars
```

```hcl
aws_region          = "us-east-1"
project_prefix      = "appointment"
instance_type       = "t3.small"
ssh_public_key_path = "~/.ssh/appointment-ec2.pub"
allowed_ssh_cidr    = "YOUR.PUBLIC.IP/32"
allowed_http_cidr   = "0.0.0.0/0"
```

Replace `YOUR.PUBLIC.IP` with the address from `checkip.amazonaws.com`.

```bash
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
terraform output
```

Write down:

- `control_public_ip` — you SSH here
- `web_public_ip` — browser demo (`https://THIS_IP/`, self-signed cert)
- `private_ips` — already baked into `inventory.ini` for you

Terraform also writes `ansible/inventory.ini` at the repo root on your laptop — that's what you'll copy to the control node next.

---

## 3. Laptop — SSH to the control node

```bash
CONTROL_IP=$(terraform -chdir=/media/hazrat/Hazrat4/Code/Node/appointment/infra/terraform/aws-classroom output -raw control_public_ip)
ssh -i ~/.ssh/appointment-ec2 ubuntu@${CONTROL_IP}
```

All commands from here until section 10 are on **the control node** unless it says "From local terminal".

---

## 4. Control node — install Ansible

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install software-properties-common -y
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt update
sudo apt install ansible -y
ansible --version
```

---

## 5. Copy the private key onto the control node

The public key is already on all three instances. The **private** key is still on your laptop. The control node needs it to SSH to `web1` and `db1`.

On the **control node**:

```bash
mkdir -p /home/ubuntu/keys
```

From your **local terminal** (new tab, stay on the laptop):

```bash
CONTROL_IP=REPLACE_WITH_CONTROL_PUBLIC_IP

scp -i ~/.ssh/appointment-ec2 \
  ~/.ssh/appointment-ec2 \
  ubuntu@${CONTROL_IP}:/home/ubuntu/keys/appointment-ec2.pem
```

Back on the **control node**:

```bash
chmod 400 /home/ubuntu/keys/appointment-ec2.pem
ls -l /home/ubuntu/keys
```

---

## 6. Control node — get this project

**Option A — copy the repo from your laptop** (includes the Terraform-generated `ansible/inventory.ini`):

From the **laptop**:

```bash
CONTROL_IP=REPLACE_WITH_CONTROL_PUBLIC_IP

scp -i ~/.ssh/appointment-ec2 -r \
  /media/hazrat/Hazrat4/Code/Node/appointment \
  ubuntu@${CONTROL_IP}:/home/ubuntu/appointment
```

**Option B — clone on the control node**, then paste private IPs yourself:

```bash
sudo apt install -y git
git clone https://github.com/Hazrat16/appointment.git /home/ubuntu/appointment
cd /home/ubuntu/appointment/ansible
cp inventory.ini.example inventory.ini
nano inventory.ini
```

Put the **private** IPs from `terraform output private_ips` into `ansible_host`, `web_private_ip`, `web_public_ip`, `db_private_ip`.

---

## 7. Control node — collections, vault, inventory

```bash
cd /home/ubuntu/appointment/ansible

ansible-galaxy collection install -r requirements.yml

cp .vault_pass.example .vault_pass
nano .vault_pass          # put a real password in it
chmod 600 .vault_pass

cp group_vars/all/vault.yml.example group_vars/all/vault.yml
nano group_vars/all/vault.yml    # fill in real secrets
ansible-vault encrypt group_vars/all/vault.yml
```

If `inventory.ini` is missing (Option B above):

```bash
cp inventory.ini.example inventory.ini
nano inventory.ini
```

Confirm the graph:

```bash
ansible-inventory --graph
```

You should see `web` and `db`. The control node is **not** in the inventory.

---

## 8. Classroom-style commands (run these on the control node)

```bash
cd /home/ubuntu/appointment/ansible

ansible all -m ping
ansible web -m command -a "hostname"
ansible db -m command -a "hostname"

ansible-playbook common.yml
ansible-playbook database.yml --check --diff
ansible-playbook database.yml
ansible-playbook webserver.yml --check --diff
ansible-playbook webserver.yml
ansible-playbook webserver.yml
```

The second `webserver.yml` run should report `changed=0` for everything except the `docker compose pull` task (it always reports whatever the compose plugin reports — pulling an unchanged `:latest` tag is a no-op).

From your **laptop** browser or curl, use the **web public IP**:

```bash
curl -k https://WEB_PUBLIC_IP/health
```

You should see `{"success":true,"message":"Server is running",...}`.

---

## 9. Drift demo

SSH to the web managed node (from the control node):

```bash
ssh -i /home/ubuntu/keys/appointment-ec2.pem ubuntu@WEB_PRIVATE_IP
sudo systemctl stop nginx
sudo systemctl is-active nginx
exit
```

Then on the **control node**:

```bash
cd /home/ubuntu/appointment/ansible
ansible-playbook webserver.yml
```

Ansible should restore Nginx (`changed=1` on the service task). Check again:

```bash
curl -k https://WEB_PUBLIC_IP/health
```

---

## 10. Capstone — full platform (`site.yml`)

Hardened Ubuntu, self-hosted MongoDB with nightly backups on `db1`, Docker + Nginx + TLS + the app itself on `web1`, health check on `/health`.

```bash
cd /home/ubuntu/appointment/ansible

ansible-playbook site.yml --syntax-check
ansible-playbook site.yml
```

Prove it from the control node:

```bash
ansible-playbook playbooks/check-health.yml
```

From the laptop (web public IP):

```bash
curl -k https://WEB_PUBLIC_IP/health
curl -k https://WEB_PUBLIC_IP/api/doctors
```

Open `https://WEB_PUBLIC_IP/` in a browser (accept the self-signed cert warning) — same checklist as [`../deployment/PHASE1.md`](../deployment/PHASE1.md#checklist): login/register work, doctors list loads, no console errors other than the expected self-signed-cert warning.

Second run (expect `changed=0` except the compose pull):

```bash
ansible-playbook site.yml
```

Optional:

```bash
ansible-playbook playbooks/backup-now.yml
ansible-playbook playbooks/rolling-deploy.yml
```

---

## 11. Day-2 commands (control node)

```bash
ansible-inventory --graph
ansible all -m ping
ansible web -a "uptime"
ansible-playbook webserver.yml
ansible-playbook site.yml
ansible-playbook site.yml --check --diff
ansible-vault view group_vars/all/vault.yml
ansible-vault edit group_vars/all/vault.yml
```

**Rolling out a new app version** (after a merge to `main` pushes new images to GHCR):

```bash
ansible-playbook playbooks/rolling-deploy.yml
```

---

## 12. Destroy the class (laptop)

This deletes the VPC and all three instances.

```bash
cd /media/hazrat/Hazrat4/Code/Node/appointment/infra/terraform/aws-classroom
terraform destroy -var-file=terraform.tfvars
```

---

## Troubleshooting

**`Failed to connect ... ssh` from the control node**

```bash
chmod 400 /home/ubuntu/keys/appointment-ec2.pem
ssh -i /home/ubuntu/keys/appointment-ec2.pem ubuntu@WEB_PRIVATE_IP
```

Use **private** IPs in `inventory.ini`. Public IPs work only if the security group allows SSH from the control node's public IP; private IPs use the VPC. `db1` has no public IP at all — you can only reach it via its private IP, from `control` or `web1`.

**`Permission denied (publickey)` onto the control node**

You used the wrong key, or Terraform's `ssh_public_key_path` pointed at the wrong file. SSH with `~/.ssh/appointment-ec2` (the private half).

**Ping timeout from your laptop to port 22**

`allowed_ssh_cidr` is not your current IP. Re-apply:

```bash
curl -s https://checkip.amazonaws.com
# edit terraform.tfvars allowed_ssh_cidr
cd infra/terraform/aws-classroom
terraform apply -var-file=terraform.tfvars
```

**`https://WEB_PUBLIC_IP/` does not load**

Run `webserver.yml` first. Security group must allow 80/443. Use the **web** public IP, not the control IP. Remember it's self-signed — `curl` needs `-k`, browsers need you to click through the warning.

**`/health` returns 502/503 after `site.yml`**

`db_private_ip` in `inventory.ini` must be the **db private IP**, and `database.yml` must have completed successfully *before* `webserver.yml` (this is why `site.yml` orders it that way — running `webserver.yml` on its own before the database exists will fail the same way). Check the backend container's logs: `docker compose -f /opt/appointment/docker-compose.yml logs api`.

**`CannotPullContainerError` / image pull fails on web1**

The GHCR packages are private and `ghcr_login_required` wasn't set, or the PAT lacks `read:packages`. See Prerequisites above.

**Amazon Linux**

Rebuild with Ubuntu 22.04 (`data.aws_ami.ubuntu_2204` in Terraform already handles this) — the playbooks are Ubuntu-only (apt, systemd unit names, Debian-style Docker/MongoDB repos).
