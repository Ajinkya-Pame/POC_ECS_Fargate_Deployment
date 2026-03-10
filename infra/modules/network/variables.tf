variable "CIDR_BLOCK" {
  type = string
}
variable "AZS" {
  type = list(string)
}

variable "GLOBAL_CIDR" {
  type = string
}

variable "ENVIRONMENT" {
  type = string
}

variable "VPC_NAME" {
  type = string
}

variable "IGW_NAME" {
  type = string
}

variable "PUBLIC_SUBNET_NAME" {
  type = string
}

variable "PRIVATE_SUBNET_NAME" {
  type = string
}

variable "PUBLIC_RT_NAME" {
  type = string
}

variable "PRIVATE_RT_NAME" {
  type = string
}

variable "NAT_EIP_NAME" {
  type = string
}

variable "NAT_GW_NAME" {
  type = string
}

variable "subnet_count" {
  type = number
}

variable "ENABLE_DNS_HOSTNAMES" {
  type = bool
}

variable "ENABLE_DNS_SUPPORT" {
  type = bool
}
