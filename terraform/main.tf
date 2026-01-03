# Hard Wordle - DigitalOcean Infrastructure
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

# Container Registry
resource "digitalocean_container_registry" "hard_wordle" {
  name                   = "hard-wordle-${var.environment}"
  subscription_tier_slug = "basic"
  region                 = var.region
}

# App Platform Application
resource "digitalocean_app" "hard_wordle" {
  spec {
    name   = "hard-wordle-${var.environment}"
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
    }

    # Static site option (alternative to service above)
    # Uncomment if you want to serve static files instead
    # static_site {
    #   name             = "hard-wordle-static"
    #   build_command    = "npm ci && npm run build"
    #   output_dir       = "/dist"
    #   index_document   = "index.html"
    #   error_document   = "index.html"
    #
    #   github {
    #     repo           = var.github_repo
    #     branch         = var.github_branch
    #     deploy_on_push = true
    #   }
    #
    #   routes {
    #     path = "/"
    #   }
    # }

    domain {
      name = var.domain_name
      type = "PRIMARY"
    }
  }
}

# Database (optional - for future features like user scores)
resource "digitalocean_database_cluster" "hard_wordle_db" {
  count      = var.enable_database ? 1 : 0
  name       = "hard-wordle-db-${var.environment}"
  engine     = "pg"
  version    = "15"
  size       = var.db_size
  region     = var.region
  node_count = 1

  tags = [
    "hard-wordle",
    var.environment
  ]
}

# Spaces (Object Storage) for assets
resource "digitalocean_spaces_bucket" "hard_wordle_assets" {
  count  = var.enable_spaces ? 1 : 0
  name   = "hard-wordle-assets-${var.environment}"
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
resource "digitalocean_cdn" "hard_wordle_cdn" {
  count      = var.enable_cdn ? 1 : 0
  origin     = digitalocean_spaces_bucket.hard_wordle_assets[0].bucket_domain_name
  custom_domain = var.cdn_domain
}