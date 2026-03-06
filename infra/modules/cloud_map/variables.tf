variable "VPC_ID" {
  type        = string
}

variable "SERVICES" {
  type        = list(string)
}

variable "NAMESPACE" {
  type        = string
}

variable "TTL" {
  type        = number
}