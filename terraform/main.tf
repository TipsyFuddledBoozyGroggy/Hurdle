# Hurdle - DigitalOcean Infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Container Registry - Free tier
resource "digitalocean_container_registry" "hurdle" {
  name                   = "hurdle-${var.environment}"
  subscription_tier_slug = "starter"  # Free tier - 500MB storage
  region                 = var.region
}

# App Platform Application
resource "digitalocean_app" "hurdle" {
  spec {
    name   = "hurdle-${var.environment}"
    region = var.region

    service {
      name               = "web"
      environment_slug   = "node-js"
      instance_count     = var.instance_count
      instance_size_slug = var.instance_size

      github {
        repo           = var.github_repo
        branch         = var.github_branch
        deploy_on_push = true
      }

      build_command = "npm ci && npm run build"
      run_command   = "npm start"

      http_port = 3000

      health_check {
        http_path = "/"
      }

      routes {
        path = "/"
      }

      # Environment variables for database connection
      env {
        key   = "DATABASE_URL"
        value = var.enable_database ? "mysql://${digitalocean_database_cluster.hurdle_db[0].user}:${digitalocean_database_cluster.hurdle_db[0].password}@${digitalocean_database_cluster.hurdle_db[0].host}:${digitalocean_database_cluster.hurdle_db[0].port}/${digitalocean_database_cluster.hurdle_db[0].database}" : ""
        scope = "RUN_TIME"
      }

      env {
        key   = "DB_HOST"
        value = var.enable_database ? digitalocean_database_cluster.hurdle_db[0].host : ""
        scope = "RUN_TIME"
      }

      env {
        key   = "DB_PORT"
        value = var.enable_database ? tostring(digitalocean_database_cluster.hurdle_db[0].port) : ""
        scope = "RUN_TIME"
      }

      env {
        key   = "DB_NAME"
        value = var.enable_database ? digitalocean_database_cluster.hurdle_db[0].database : ""
        scope = "RUN_TIME"
      }

      env {
        key   = "DB_USER"
        value = var.enable_database ? digitalocean_database_cluster.hurdle_db[0].user : ""
        scope = "RUN_TIME"
      }

      env {
        key   = "DB_PASSWORD"
        value = var.enable_database ? digitalocean_database_cluster.hurdle_db[0].password : ""
        scope = "RUN_TIME"
      }
    }

    dynamic "domain" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        name = var.domain_name
        type = "PRIMARY"
      }
    }
  }
}

# MySQL Database
resource "digitalocean_database_cluster" "hurdle_db" {
  count      = var.enable_database ? 1 : 0
  name       = "hurdle-db-${var.environment}"
  engine     = "mysql"
  version    = "8"
  size       = var.db_size
  region     = var.region
  node_count = 1

  tags = [
    "hurdle",
    var.environment
  ]
}

# Database for the application
resource "digitalocean_database_db" "hurdle_app_db" {
  count      = var.enable_database ? 1 : 0
  cluster_id = digitalocean_database_cluster.hurdle_db[0].id
  name       = "hurdle"
}

# Spaces (Object Storage) for assets
resource "digitalocean_spaces_bucket" "hurdle_assets" {
  count  = var.enable_spaces ? 1 : 0
  name   = "hurdle-assets-${var.environment}"
  region = var.region
  acl    = "public-read"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# CDN for better performance
resource "digitalocean_cdn" "hurdle_cdn" {
  count      = var.enable_cdn ? 1 : 0
  origin     = digitalocean_spaces_bucket.hurdle_assets[0].bucket_domain_name
  custom_domain = var.cdn_domain
}