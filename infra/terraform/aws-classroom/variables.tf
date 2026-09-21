variable "aws_region" {
  description = "AWS region to provision into."
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefix for resource names/tags."
  type        = string
  default     = "appointment"
}

variable "instance_type" {
  description = "EC2 instance type for all three nodes."
  type        = string
  default     = "t3.small"
}

variable "ssh_public_key_path" {
  description = "Path to the PUBLIC half of the SSH key pair shared by all three instances. The private key never touches Terraform."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the control node on port 22 (your current public IP/32)."
  type        = string
}

variable "allowed_http_cidr" {
  description = "CIDR allowed to reach web1 on 80/443 (0.0.0.0/0 for a public demo)."
  type        = string
  default     = "0.0.0.0/0"
}
