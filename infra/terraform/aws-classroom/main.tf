terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu_2204" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- Networking ---

resource "aws_vpc" "this" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_prefix}-vpc" }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.project_prefix}-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.42.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_prefix}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = { Name = "${var.project_prefix}-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# --- Key pair (public key only — the private key never touches Terraform state) ---

resource "aws_key_pair" "this" {
  key_name   = "${var.project_prefix}-key"
  public_key = file(var.ssh_public_key_path)
}

# --- Instances ---
# All three sit in the same public subnet for simplicity (matches the classroom
# kit). Only `control` and `web1` get a public IP — `db1` is reached over the
# VPC via its private IP, and its security group never allows internet access.

resource "aws_instance" "control" {
  ami                         = data.aws_ami.ubuntu_2204.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = aws_key_pair.this.key_name
  vpc_security_group_ids      = [aws_security_group.control.id]
  associate_public_ip_address = true

  tags = { Name = "${var.project_prefix}-control" }
}

resource "aws_instance" "web1" {
  ami                         = data.aws_ami.ubuntu_2204.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = aws_key_pair.this.key_name
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true

  tags = { Name = "${var.project_prefix}-web1" }
}

resource "aws_instance" "db1" {
  ami                         = data.aws_ami.ubuntu_2204.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = aws_key_pair.this.key_name
  vpc_security_group_ids      = [aws_security_group.db.id]
  associate_public_ip_address = false

  tags = { Name = "${var.project_prefix}-db1" }
}

# --- Rendered Ansible inventory ---

resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../../../ansible/inventory.ini"
  content = templatefile("${path.module}/templates/inventory.tpl", {
    control_public_ip = aws_instance.control.public_ip
    web_private_ip    = aws_instance.web1.private_ip
    web_public_ip     = aws_instance.web1.public_ip
    db_private_ip     = aws_instance.db1.private_ip
  })
}
