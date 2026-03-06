variable "CLUSTER_ID" {
  type = string
}

variable "SERVICES" {
  type = list(string)
}

variable "IMAGE_URL" {
  type = string
}

variable "BACKEND_PORT" {
  type = number
}

variable "PRIVATE_SUBNETS" {
  type = list(string)
}

variable "BACKEND_SG_ID" {
  type = string
}

variable "BACKEND_SERVICE_DISCOVERY_ARN" {
  type = string
}

variable "LOG_DRIVER" {
  type = string
}

variable "REGION" {
  type = string
}

variable "CPU" {
  type = string
}

variable "MEMORY" {
  type = string
}

variable "EXECUTION_ROLE_ARN" {
  type = string
}

variable "NETWORK_MODE" {
  type = string
}

variable "RETENTION_DAYS" {
  type = number
}

variable "DESIRED_COUNT" {
  type = number
}

variable "DATABASE_URL" {
  type = string
}

variable "REDIS_URL" {
  type = string
}

variable "ADMIN_PASSWORD" {
  type = string
}