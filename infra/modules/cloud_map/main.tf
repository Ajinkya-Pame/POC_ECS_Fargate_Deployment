# Create the Private DNS Namespace
resource "aws_service_discovery_private_dns_namespace" "cricket" {
  name        = var.NAMESPACE
  description = "Private namespace for ECS microservices"
  vpc         = var.VPC_ID
}

# Create a Service Discovery Service for each item in the list
resource "aws_service_discovery_service" "cricket_services" {
  for_each = toset(var.SERVICES)

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.cricket.id

    dns_records {
      ttl  = var.TTL
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  # Health check for ECS to ensure only healthy tasks are in DNS
  health_check_custom_config {
    failure_threshold = 1
  }
}
