# Hard Wordle - DigitalOcean Terraform Infrastructure

This directory contains Terraform configuration files to deploy Hard Wordle on DigitalOcean.

## Prerequisites

1. **DigitalOcean Account**: Create an account at [digitalocean.com](https://digitalocean.com)
2. **DigitalOcean API Token**: Generate a personal access token in your DigitalOcean control panel
3. **Terraform**: Install Terraform CLI ([terraform.io](https://terraform.io))
4. **GitHub Repository**: Your Hard Wordle code should be in a GitHub repository

## Quick Start

### 1. Configure Variables

Copy the example variables file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
do_token      = "your-digitalocean-api-token"
github_repo   = "your-username/hard-wordle"
github_branch = "main"
environment   = "dev"
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

### 5. Get Application URL

```bash
terraform output app_url
```

## Configuration Options

### Basic Configuration

- `do_token`: Your DigitalOcean API token
- `github_repo`: GitHub repository in format "owner/repo"
- `github_branch`: Branch to deploy (default: "main")
- `environment`: Environment name (dev, staging, prod)
- `region`: DigitalOcean region (default: "nyc3")

### App Platform Settings

- `instance_count`: Number of app instances (default: 1)
- `instance_size`: Instance size (default: "basic-xxs")
  - Available sizes: basic-xxs, basic-xs, basic-s, basic-m
  - Professional: professional-xs, professional-s, professional-m, professional-l

### Optional Features

- `enable_database`: Enable PostgreSQL database for future features
- `enable_spaces`: Enable object storage for assets
- `enable_cdn`: Enable CDN for better performance
- `domain_name`: Custom domain for your app

## Deployment Methods

The Terraform configuration supports two deployment methods:

### 1. App Platform Service (Default)
- Runs your Node.js application
- Automatic scaling
- Built-in load balancing
- Health checks

### 2. Static Site (Alternative)
- Serves pre-built static files
- Lower cost
- Better performance for static content
- Uncomment the `static_site` block in `main.tf`

## Cost Optimization

### Development Environment
```hcl
instance_size    = "basic-xxs"  # $5/month
instance_count   = 1
enable_database  = false
enable_spaces    = false
enable_cdn       = false
```

### Production Environment
```hcl
instance_size    = "basic-s"    # $12/month
instance_count   = 2
enable_database  = true         # $15/month
enable_spaces    = true         # $5/month + usage
enable_cdn       = true         # $1/month + usage
```

## Commands

### Deploy
```bash
terraform apply
```

### Update
```bash
terraform plan
terraform apply
```

### Destroy
```bash
terraform destroy
```

### View Outputs
```bash
terraform output
```

### View State
```bash
terraform show
```

## Environment Management

### Multiple Environments

Create separate `.tfvars` files for each environment:

```bash
# Development
terraform apply -var-file="dev.tfvars"

# Staging
terraform apply -var-file="staging.tfvars"

# Production
terraform apply -var-file="prod.tfvars"
```

### Terraform Workspaces

```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch workspace
terraform workspace select dev
terraform apply
```

## Troubleshooting

### Common Issues

1. **Invalid API Token**
   - Verify your DigitalOcean API token is correct
   - Check token permissions

2. **GitHub Repository Access**
   - Ensure repository is public or DigitalOcean has access
   - Verify repository name format: "owner/repo"

3. **Domain Configuration**
   - Add DNS records pointing to your app
   - Verify domain ownership

4. **Build Failures**
   - Check your `package.json` scripts
   - Ensure `npm run build` works locally

### Logs and Monitoring

- View app logs in DigitalOcean control panel
- Monitor performance metrics
- Set up alerts for downtime

## Security Best Practices

1. **API Token Security**
   - Never commit tokens to version control
   - Use environment variables or secure storage
   - Rotate tokens regularly

2. **Environment Variables**
   - Store sensitive data in app environment variables
   - Use DigitalOcean App Platform environment settings

3. **Database Security**
   - Enable SSL connections
   - Use strong passwords
   - Restrict database access

## Next Steps

After deployment:

1. Configure custom domain and SSL
2. Set up monitoring and alerts
3. Configure backup strategies
4. Implement CI/CD pipeline
5. Add database for user features (scores, statistics)

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Terraform DigitalOcean Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)