variable "cidr_block" {
  type = string
}
variable "azs" {
  type = list(string)
}

variable "global_cidr" {
  type = string
}

variable "container_port" {
  type = number
}

variable "backend_port" {
  type = number
}

variable "db_port" {
  type = number
}

variable "cache_port" {
  type = number
}

variable "https_port" {
  type = number
}

variable "zero_port" {
  type = number
}

variable "services" {
  type = map(string)
}

variable "namespace" {
  type = string
}

variable "ttl" {
  type = number
}

variable "CLUSTER_NAME" {
  type = string
}

variable "log_driver" {
  type = string
}

variable "region" {
  type = string
}

variable "cpu" {
  type = string
}

variable "memory" {
  type = string
}

variable "network_mode" {
  type = string
}

variable "retention_days" {
  type = number
}

variable "DATABASE_URL" {
  type      = string
  sensitive = true
}

variable "REDIS_URL" {
  type      = string
  sensitive = true
}

variable "ADMIN_PASSWORD" {
  type      = string
  sensitive = true
}

variable "db_cpu" {
  type = string
}

variable "db_memory" {
  type = string
}

variable "POSTGRES_DB" {
  type = string
}

variable "POSTGRES_USER" {
  type = string
}

variable "POSTGRES_PASSWORD" {
  type      = string
  sensitive = true
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "ecs_prefix" {
  type = string
}

variable "req_compatibility" {
  type = string
}

variable "tcp_protocol" {
  type = string
}

variable "service" {
  type = string
}

variable "container" {
  type = string
}

variable "task" {
  type = string
}

variable "fargate_base" {
  type = number
}

variable "fargate_weight" {
  type = number
}

variable "app_name" {
  type = string
}

variable "mutability" {
  type = string
}

variable "enc_type" {
  type = string
}

variable "routing_policy" {
  type = string
}

variable "dns_description" {
  type = string
}

variable "dns_record" {
  type = string
}

variable "alb_type" {
  type = string
}

variable "alb_tg_name" {
  type = string
}

variable "http_protocol" {
  type = string
}

variable "target_type" {
  type = string
}

variable "hc_interval" {
  type = number
}

variable "hc_timeout" {
  type = number
}

variable "threshold" {
  type = number
}

variable "alb_default_action" {
  type = string
}

variable "alb_name" {
  type = string
}

# ========== Global Tag Variables ==========
variable "environment" {
  type        = string
  description = "Deployment environment (dev, qa, prod)"
}

variable "project" {
  type        = string
  description = "Project name for cost tracking"
}

variable "owner" {
  type        = string
  description = "Team or individual responsible"
}

variable "cost_center" {
  type        = string
  description = "Cost center for billing"
}

# ========== Resource-Specific Name Tag Variables ==========
variable "vpc_name" {
  type = string
}

variable "igw_name" {
  type = string
}

variable "public_subnet_name" {
  type = string
}

variable "private_subnet_name" {
  type = string
}

variable "public_rt_name" {
  type = string
}

variable "private_rt_name" {
  type = string
}

variable "nat_eip_name" {
  type = string
}

variable "nat_gw_name" {
  type = string
}

variable "alb_sg_name" {
  type = string
}

variable "frontend_sg_name" {
  type = string
}

variable "backend_sg_name" {
  type = string
}

variable "db_sg_name" {
  type = string
}

variable "cache_sg_name" {
  type = string
}

variable "exec_role_name" {
  type = string
}

variable "hc_path" {
  type = string
}

variable "force_delete_ecr" {
  type    = bool
  default = true
}

variable "all_protocol" {
  type = string
}

variable "frontend_count" {
  type = number
}

variable "backend_count" {
  type = number
}

variable "db_count" {
  type = number
}

variable "cache_count" {
  type = number
}

variable "https_protocol" {
  type = string
}

variable "policy_type" {
  type = string
}

variable "cert_arn" {
  type = string
}
