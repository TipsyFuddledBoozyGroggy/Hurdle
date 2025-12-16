# 🆓 Hard Wordle - 100% FREE TIER Deployment Guide

## 💰 Cost: $0.00 - Completely Free!

This guide shows you how to deploy Hard Wordle using **ONLY** AWS Free Tier services. No charges will be incurred.

## 🏗️ Free Tier Architecture

Instead of the production ECS Fargate + ALB setup, this uses:

- **S3 Static Website Hosting** (Free: 5GB storage, 20K GET requests/month)
- **CodePipeline** (Free: 1 active pipeline/month)  
- **CodeBuild** (Free: 100 build minutes/month)
- **ECR** (Free: 500MB storage for 12 months)
- **CloudWatch Logs** (Free: 5GB ingestion/month)
- **VPC/Networking** (Free: Basic networking resources)

## 🚀 Quick Deployment

### Step 1: Deploy Free Tier Infrastructure
```bash
# Deploy all free tier stacks
./infrastructure/deploy-free-tier.sh dev
```

### Step 2: Access Your Website
After deployment completes, you'll get a URL like:
```
🌐 Website URL: http://dev-hard-wordle-website-864899864715.s3-website-us-east-1.amazonaws.com
```

## 📊 Free Tier Limits & Usage

| Service | Free Tier Limit | Hard Wordle Usage | Status |
|---------|----------------|-------------------|---------|
| **S3 Storage** | 5 GB/month | ~5 MB (website files) | ✅ Safe |
| **S3 Requests** | 20K GET, 2K PUT/month | Low traffic usage | ✅ Safe |
| **ECR Storage** | 500 MB for 12 months | ~50-100 MB (Docker image) | ✅ Safe |
| **CodePipeline** | 1 active pipeline/month | 1 pipeline | ✅ Safe |
| **CodeBuild** | 100 minutes/month | ~2-5 minutes per build | ✅ Safe |
| **CloudWatch Logs** | 5 GB/month | Minimal logging | ✅ Safe |

## 🔄 How It Works

1. **Code Push**: You push code to GitHub
2. **Pipeline Trigger**: CodePipeline detects changes
3. **Build**: CodeBuild runs tests and builds the app
4. **Deploy**: Built files are uploaded to S3
5. **Access**: Website is available via S3 static hosting URL

## 📁 File Structure Changes

The free tier deployment uses these templates:
- `infrastructure/free-tier-ecs-stack.yaml` - S3 website hosting
- `infrastructure/free-tier-pipeline-stack.yaml` - CI/CD for static site
- `infrastructure/parameters/free-tier-dev-params.json` - Free tier parameters
- `infrastructure/deploy-free-tier.sh` - Free tier deployment script

## 🛠️ Manual Deployment Steps

If you prefer manual deployment:

### 1. Deploy Network Stack
```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-network-dev \
  --template-body file://infrastructure/network-stack.yaml \
  --parameters file://infrastructure/parameters/free-tier-dev-params.json \
  --capabilities CAPABILITY_IAM
```

### 2. Deploy ECR Stack
```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-ecr-dev \
  --template-body file://infrastructure/ecr-stack.yaml \
  --parameters file://infrastructure/parameters/free-tier-dev-params.json
```

### 3. Deploy Website Stack
```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-website-dev \
  --template-body file://infrastructure/free-tier-ecs-stack.yaml \
  --parameters file://infrastructure/parameters/free-tier-dev-params.json
```

### 4. Deploy Pipeline Stack
```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-pipeline-dev \
  --template-body file://infrastructure/free-tier-pipeline-stack.yaml \
  --parameters file://infrastructure/parameters/free-tier-dev-params.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

## 🔍 Monitoring Usage

Monitor your free tier usage:
```bash
# Check current costs (should be $0.00)
./infrastructure/monitor-costs.sh dev

# Check S3 bucket size
aws s3 ls s3://dev-hard-wordle-website-864899864715 --recursive --human-readable --summarize

# Check ECR repository size
aws ecr describe-repositories --repository-names dev-hard-wordle
```

## 🚨 Important Notes

### What's Different from Production:
- ❌ No load balancer (ALB)
- ❌ No container orchestration (ECS Fargate)
- ❌ No auto-scaling
- ❌ No HTTPS (unless you add CloudFront)
- ✅ Static website hosting only
- ✅ Still has CI/CD pipeline
- ✅ Still runs tests before deployment

### Limitations:
- **Static Only**: No server-side processing
- **HTTP Only**: No SSL certificate (can add CloudFront for HTTPS)
- **Basic URL**: S3 website URL (not custom domain)
- **No Auto-scaling**: Fixed capacity

### Perfect For:
- ✅ Learning AWS
- ✅ Portfolio projects
- ✅ Proof of concepts
- ✅ Development/testing
- ✅ Static web applications

## 🔄 Switching to Production Later

When ready for production, you can deploy the full stack:
```bash
# Deploy production ECS Fargate stack (costs ~$24-32/month)
./infrastructure/deploy.sh prod
```

## 🧹 Cleanup

To delete all resources and avoid any potential charges:
```bash
# Delete all stacks
aws cloudformation delete-stack --stack-name hard-wordle-pipeline-dev
aws cloudformation delete-stack --stack-name hard-wordle-website-dev  
aws cloudformation delete-stack --stack-name hard-wordle-ecr-dev
aws cloudformation delete-stack --stack-name hard-wordle-network-dev

# Empty S3 buckets first (required before deletion)
aws s3 rm s3://dev-hard-wordle-website-864899864715 --recursive
aws s3 rm s3://dev-hard-wordle-artifacts-864899864715 --recursive
```

## 🎯 Summary

This free tier deployment gives you:
- ✅ **$0.00 monthly cost**
- ✅ **Automated CI/CD pipeline**
- ✅ **Professional AWS architecture**
- ✅ **Perfect for portfolios**
- ✅ **Easy to upgrade later**

Your Hard Wordle game will be fully functional and accessible via the S3 website URL, with automatic deployments from GitHub, all within AWS Free Tier limits!