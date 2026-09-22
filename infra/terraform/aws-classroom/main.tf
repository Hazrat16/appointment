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

# db1 lives in its own subnet so its route table (via the NAT Gateway below)
# can differ from web1/control's (direct via the IGW). Route tables attach
# per-subnet, not per-instance.
resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.42.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = { Name = "${var.project_prefix}-private" }
}

# NAT Gateway gives db1 outbound-only internet access (apt, the MongoDB apt
# repo/GPG key, pip) without ever assigning it a public IP or opening any
# inbound path from the internet.
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project_prefix}-nat-eip" }
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = { Name = "${var.project_prefix}-nat" }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = { Name = "${var.project_prefix}-private-rt" }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# --- Key pair (public key only — the private key never touches Terraform state) ---

resource "aws_key_pair" "this" {
  key_name   = "${var.project_prefix}-key"
  public_key = file(var.ssh_public_key_path)
}

# --- Instances ---
# `control` and `web1` sit in the public subnet and get a public IP. `db1`
# sits in the private subnet with no public IP — it's reached over the VPC
# via its private IP, and its security group never allows *inbound* internet
# traffic. It still gets *outbound* internet access (for apt/pip/the MongoDB
# repo) via the NAT Gateway on the private route table.

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
  subnet_id                   = aws_subnet.private.id
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
    vpc_cidr          = aws_vpc.this.cidr_block
  })
}
