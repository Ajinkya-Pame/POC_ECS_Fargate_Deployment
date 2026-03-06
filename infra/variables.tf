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
  type = list(string)
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
  type = string
}

variable "REDIS_URL" {
  type = string
}

variable "ADMIN_PASSWORD" {
  type = string
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
  type = string
}

variable "desired_count" {
  type    = number
  default = 1
}

