# App Platform Outputs
output "app_url" {
  description = "URL of the deployed Hard Wordle application"
  value       = digitalocean_app.hard_wordle.live_url
}

output "app_id" {
  description = "DigitalOcean App Platform application ID"
  value       = digitalocean_app.hard_wordle.id
}

output "app_urn" {
  description = "DigitalOcean App Platform application URN"
  value       = digitalocean_app.hard_wordle.urn
}

# Container Registry Outputs
output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = digitalocean_container_registry.hard_wordle.endpoint
}

output "registry_server_url" {
  description = "Container registry server URL"
  value       = digitalocean_container_registry.hard_wordle.server_url
}

# Database Outputs (if enabled)
output "database_host" {
  description = "Database host"
  value       = var.enable_database ? digitalocean_database_cluster.hard_wordle_db[0].host : null
}

output "database_port" {
  description = "Database port"
  value       = var.enable_database ? digitalocean_database_cluster.hard_wordle_db[0].port : null
}

output "database_name" {
  description = "Database name"
  value       = var.enable_database ? digitalocean_database_cluster.hard_wordle_db[0].database : null
}

output "database_user" {
  description = "Database user"
  value       = var.enable_database ? digitalocean_database_cluster.hard_wordle_db[0].user : null
  sensitive   = true
}

output "database_password" {
  description = "Database password"
  value       = var.enable_database ? digitalocean_database_cluster.hard_wordle_db[0].password : null
  sensitive   = true
}

# Spaces Outputs (if enabled)
output "spaces_bucket_name" {
  description = "Spaces bucket name"
  value       = var.enable_spaces ? digitalocean_spaces_bucket.hard_wordle_assets[0].name : null
}

output "spaces_bucket_domain" {
  description = "Spaces bucket domain"
  value       = var.enable_spaces ? digitalocean_spaces_bucket.hard_wordle_assets[0].bucket_domain_name : null
}

# CDN Outputs (if enabled)
output "cdn_endpoint" {
  description = "CDN endpoint"
  value       = var.enable_cdn ? digitalocean_cdn.hard_wordle_cdn[0].endpoint : null
}