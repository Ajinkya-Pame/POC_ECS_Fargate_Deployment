output "namespace_id" {
  value = aws_service_discovery_private_dns_namespace.cricket.id
}

output "service_discovery_arns" {
  value       = { for k, v in aws_service_discovery_service.cricket_services : k => v.arn }
}
