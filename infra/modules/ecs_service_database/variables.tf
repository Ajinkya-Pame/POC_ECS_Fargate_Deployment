variable "CLUSTER_ID" {
  type = string
}

variable "SERVICES" {
  type = list(string)
}

variable "IMAGE_URL" {
  type = string
}

variable "DB_PORT" {
  type = number
}

variable "PRIVATE_SUBNETS" {
  type = list(string)
}

variable "DATABASE_SG_ID" {
  type = string
}

variable "DATABASE_SERVICE_DISCOVERY_ARN" {
  type = string
}

variable "LOG_DRIVER" {
  type = string
}

variable "REGION" {
  type = string
}

variable "DB_CPU" {
  type = string
}

variable "DB_MEMORY" {
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

variable "ECS_PREFIX" {
  type = string
}

variable "TASK" {
  type = string
}

variable "REQ_COMPATIBILITY" {
  type = string
}

variable "CONTAINER" {
  type = string
}

variable "TCP_PROTOCOL" {
  type = string
}

variable "SERVICE" {
  type = string
}
