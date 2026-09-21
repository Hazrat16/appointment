# control: SSH from your laptop/instructor IP only. It is the only node the
# outside world can reach for management.
resource "aws_security_group" "control" {
  name        = "${var.project_prefix}-control-sg"
  description = "Ansible control node"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "SSH from allowed IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_prefix}-control-sg" }
}

# web1: SSH only from the control node's SG (Ansible manages it that way, not
# from the public internet); HTTP/HTTPS open for the demo.
resource "aws_security_group" "web" {
  name        = "${var.project_prefix}-web-sg"
  description = "Nginx + app containers"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "SSH from control node"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.control.id]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_prefix}-web-sg" }
}

# db1: never internet-facing. SSH only from control (Ansible management);
# Mongo only from web1 (the app) and control (running ad-hoc mongosh/backup
# tasks). No public IP is even assigned to this instance (see main.tf).
resource "aws_security_group" "db" {
  name        = "${var.project_prefix}-db-sg"
  description = "MongoDB"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "SSH from control node"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.control.id]
  }

  ingress {
    description     = "MongoDB from web1"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "MongoDB from control (ad-hoc admin/backup tasks)"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.control.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_prefix}-db-sg" }
}
