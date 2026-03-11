variable "GLOBAL_CIDR" {
  type = string
}

variable "VPC_ID" {
  type = string
}

variable "CONTAINER_PORT" {
  type = number
}

variable "ZERO_PORT" {
  type = number
}

variable "HTTPS_PORT" {
  type = number
}

variable "BACKEND_PORT" {
  type = number
}

variable "DB_PORT" {
  type = number
}

variable "CACHE_PORT" {
  type = number
}

variable "ALB_SG_NAME" {
  type = string
}

variable "FRONTEND_SG_NAME" {
  type = string
}

variable "BACKEND_SG_NAME" {
  type = string
}

variable "DB_SG_NAME" {
  type = string
}

variable "CACHE_SG_NAME" {
  type = string
}

variable "ALL_PROTOCOL" {
  type = string
}

variable "TCP_PROTOCOL" {
  type = string
}
