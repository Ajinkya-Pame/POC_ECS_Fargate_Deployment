# ========== Networking ==========
variable "cidr_block" {
  type = string
}

variable "azs" {
  type = list(string)
}

variable "global_cidr" {
  type = string
}

variable "subnet_count" {
  type = number
}

variable "enable_dns_hostnames" {
  type = bool
}

variable "enable_dns_support" {
  type = bool
}

variable "region" {
  type = string
}

# ========== EKS Cluster ==========
variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
}

variable "k8s_version" {
  type        = string
  description = "Kubernetes version for EKS"
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for EKS worker nodes"
  default     = "t3.medium"
}

variable "node_desired_size" {
  type        = number
  description = "Desired number of worker nodes"
  default     = 2
}

variable "node_max_size" {
  type        = number
  description = "Maximum number of worker nodes"
  default     = 3
}

variable "node_min_size" {
  type        = number
  description = "Minimum number of worker nodes"
  default     = 1
}

variable "retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 7
}

# ========== ECR ==========
variable "services" {
  type = map(string)
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

variable "force_delete_ecr" {
  type    = bool
  default = true
}

variable "scan_on_push" {
  type = bool
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

# ========== Resource Name Tags ==========
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
