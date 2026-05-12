variable "CLUSTER_NAME" {
  type        = string
  description = "Name of the EKS cluster"
}

variable "K8S_VERSION" {
  type        = string
  description = "Kubernetes version for EKS"
}

variable "CLUSTER_ROLE_ARN" {
  type        = string
  description = "IAM role ARN for the EKS cluster"
}

variable "NODE_ROLE_ARN" {
  type        = string
  description = "IAM role ARN for EKS node group"
}

variable "CLUSTER_SG_ID" {
  type        = string
  description = "Security group ID for the EKS cluster"
}

variable "PUBLIC_SUBNET_IDS" {
  type        = list(string)
  description = "Public subnet IDs for EKS"
}

variable "PRIVATE_SUBNET_IDS" {
  type        = list(string)
  description = "Private subnet IDs for EKS node group"
}

variable "NODE_INSTANCE_TYPE" {
  type        = string
  description = "EC2 instance type for worker nodes"
  default     = "t3.medium"
}

variable "NODE_DESIRED_SIZE" {
  type        = number
  description = "Desired number of worker nodes"
  default     = 2
}

variable "NODE_MAX_SIZE" {
  type        = number
  description = "Maximum number of worker nodes"
  default     = 3
}

variable "NODE_MIN_SIZE" {
  type        = number
  description = "Minimum number of worker nodes"
  default     = 1
}

variable "EBS_CSI_ROLE_ARN" {
  type        = string
  description = "IAM role ARN for EBS CSI driver"
}

variable "LOG_RETENTION_DAYS" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 7
}
