# ============================================
# TestApp Azure Infrastructure - Variables
# ============================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "testapp"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "app_service_sku" {
  description = "SKU tier for App Service Plan"
  type        = string
  default     = "B1"

  validation {
    condition     = contains(["F1", "D1", "B1", "B2", "B3", "S1", "S2", "S3", "P1v2", "P2v2", "P3v2"], var.app_service_sku)
    error_message = "Invalid SKU tier."
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "TestApp"
    Environment = "production"
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable Azure CDN"
  type        = bool
  default     = false
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}
