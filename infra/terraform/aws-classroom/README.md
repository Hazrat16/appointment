# Terraform — 3-node AWS classroom deployment

Provisions `control` + `web1` + `db1` Ubuntu 22.04 EC2 instances for the Ansible-driven deployment documented in [`ansible/README.md`](../../../ansible/README.md). This is a separate, self-contained path from the MongoDB Atlas config in [`infra/terraform/`](../) — this one self-hosts MongoDB on `db1` instead, and does not use Atlas at all.

`db1` has no public IP and sits in its own private subnet; a NAT Gateway gives it outbound-only internet access (needed by the `mongodb` Ansible role for apt/pip and the MongoDB repo) without ever exposing it to inbound internet traffic. The NAT Gateway has an hourly cost (~$0.045/hr on top of data processing) that accrues for as long as `terraform apply` is up, even when idle — `terraform destroy` when you're done with a session.

## Setup

```bash
ssh-keygen -t ed25519 -f ~/.ssh/appointment-ec2 -C appointment-ec2 -N ""
chmod 400 ~/.ssh/appointment-ec2

curl -s https://checkip.amazonaws.com   # your public IP, for allowed_ssh_cidr

cp example.tfvars terraform.tfvars
# edit terraform.tfvars: set allowed_ssh_cidr to "<that IP>/32"
```

## Usage

```bash
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
terraform output
```

This also writes `ansible/inventory.ini` (relative to the repo root) automatically — that's what the Ansible playbooks in [`ansible/`](../../../ansible/) read.

## Destroy

```bash
terraform destroy -var-file=terraform.tfvars
```

Deletes the VPC and all three instances. `ansible/inventory.ini` is left behind (it's just a generated file); delete it yourself if you don't want stale IPs lying around.
