# DigitalOcean Token
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Region
variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

# GitHub Repository
variable "github_repo" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = "TipsyFuddledBoozyGroggy/Hurdle"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

# App Platform Configuration
variable "instance_count" {
  description = "Number of app instances"
  type        = number
  default     = 1
}

variable "instance_size" {
  description = "App instance size"
  type        = string
  default     = "basic-xxs"
  validation {
    condition = contains([
      "basic-xxs", "basic-xs", "basic-s", "basic-m",
      "professional-xs", "professional-s", "professional-m", "professional-l"
    ], var.instance_size)
    error_message = "Instance size must be a valid DigitalOcean App Platform size."
  }
}

# Domain Configuration
variable "domain_name" {
  description = "Custom domain name for the app"
  type        = string
  default     = ""
}

# Database Configuration
variable "enable_database" {
  description = "Enable PostgreSQL database"
  type        = bool
  default     = false
}

variable "db_size" {
  description = "Database cluster size"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

# Spaces Configuration
variable "enable_spaces" {
  description = "Enable DigitalOcean Spaces for asset storage"
  type        = bool
  default     = false
}

# CDN Configuration
variable "enable_cdn" {
  description = "Enable CDN for Spaces"
  type        = bool
  default     = false
}

variable "cdn_domain" {
  description = "Custom domain for CDN"
  type        = string
  default     = ""
}