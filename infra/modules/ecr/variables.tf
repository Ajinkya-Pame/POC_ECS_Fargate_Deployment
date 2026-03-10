variable "SERVICES" {
  type = map(string)
}

variable "MUTABILITY" {
  type = string
}

variable "APP_NAME" {
  type = string
}

variable "ENC_TYPE" {
  type = string
}

variable "FORCE_DELETE" {
  type = bool
}

variable "ENVIRONMENT" {
  type = string
}

variable "SCAN_ON_PUSH" {
  type = bool
}
