output "control_public_ip" {
  description = "SSH here to drive Ansible."
  value       = aws_instance.control.public_ip
}

output "web_public_ip" {
  description = "Browser/health-check target for the app demo."
  value       = aws_instance.web1.public_ip
}

output "private_ips" {
  description = "Private IPs for inventory.ini (also written automatically to ansible/inventory.ini)."
  value = {
    control = aws_instance.control.private_ip
    web     = aws_instance.web1.private_ip
    db      = aws_instance.db1.private_ip
  }
}
