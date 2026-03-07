variable "CLUSTER_ID" {
  type = string
}

variable "SERVICES" {
  type = map(string)
}

variable "IMAGE_URL" {
  type = string
}

variable "CONTAINER_PORT" {
  type = number
}

variable "PRIVATE_SUBNETS" {
  type = list(string)
}

variable "FRONTEND_SG_ID" {
  type = string
}

variable "TARGET_GROUP_ARN" {
  type = string
}

variable "FRONTEND_SERVICE_DISCOVERY_ARN" {
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

variable "ECS_PREFIX" {
  type = string
}

variable "REQ_COMPATIBILITY" {
  type = string
}

variable "TCP_PROTOCOL" {
  type = string
}

variable "SERVICE" {
  type = string
}

variable "CONTAINER" {
  type = string
}

variable "TASK" {
  type = string
}
