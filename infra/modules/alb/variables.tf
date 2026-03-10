variable "VPC_ID" {
  type = string
}
variable "public_subnet_ids" {
  type = list(string)
}
variable "alb_sg_id" {
  type = string
}

variable "ALB_NAME" {
  type = string
}

variable "ALB_TYPE" {
  type = string
}

variable "ALB_TG_NAME" {
  type = string
}

variable "CONTAINER_PORT" {
  type = string
}

variable "HTTP_PROTOCOL" {
  type = string
}

variable "TARGET_TYPE" {
  type = string
}

variable "HC_INTERVAL" {
  type = number
}

variable "HC_TIMEOUT" {
  type = number
}

variable "THRESHOLD" {
  type = number
}

variable "ALB_DEFAULT_ACTION" {
  type = string
}

variable "HC_PATH" {
  type = string
}

variable "ENVIRONMENT" {
  type = string
}

variable "HTTPS_PROTOCOL" {
  type = string
}

variable "HTTPS_PORT" {
  type = string
}

variable "POLICY_TYPE" {
  type = string
}

variable "CERT_ARN" {
  type = string
}

variable "REDIRECT" {
  type = string
}

variable "PERM_STATUS_CODE" {
  type = string
}

variable "INTERNAL_TYPE" {
  type = bool
}

variable "DELETE_PROTECTION" {
  type = bool
}
