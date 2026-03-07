variable "VPC_ID" {
  type = string
}

variable "SERVICES" {
  type = map(string)
}

variable "NAMESPACE" {
  type = string
}

variable "TTL" {
  type = number
}

variable "DNS_DESCRIPTION" {
  type = string
}

variable "DNS_RECORD" {
  type = string
}

variable "ROUTING_POLICY" {
  type = string
}
