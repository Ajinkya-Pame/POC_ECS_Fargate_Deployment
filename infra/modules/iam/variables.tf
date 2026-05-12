variable "CLUSTER_NAME" {
  type        = string
  description = "EKS cluster name for IAM role naming"
}

variable "OIDC_PROVIDER_URL" {
  type        = string
  description = "OIDC provider URL from EKS cluster"
  default     = ""
}

variable "OIDC_PROVIDER_ARN" {
  type        = string
  description = "OIDC provider ARN from EKS cluster"
  default     = ""
}
