output "alb_dns_name" {
  description = "The DNS name of the Load Balancer"
  value       = module.alb.alb_dns_name
}
