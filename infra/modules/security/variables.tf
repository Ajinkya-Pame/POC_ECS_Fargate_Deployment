variable "VPC_ID" {
  type = string
}

variable "GLOBAL_CIDR" {
  type = string
}

variable "CLUSTER_NAME" {
  type        = string
  description = "EKS cluster name for security group naming and tagging"
}
