# CareConnect Terraform Variables

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "careconnect-dev"  # Replace with actual project
}

variable "region" {
  description = "GCP Region (must be northamerica-northeast1 for Canada)"
  type        = string
  default     = "northamerica-northeast1"

  validation {
    condition     = var.region == "northamerica-northeast1"
    error_message = "Region must be northamerica-northeast1 (Montreal, Canada) for data residency compliance."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "access_policy_id" {
  description = "Access Context Manager policy ID for VPC-SC (optional)"
  type        = string
  default     = ""
}
