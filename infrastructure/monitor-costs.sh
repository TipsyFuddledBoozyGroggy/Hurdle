#!/bin/bash

# Script to monitor AWS costs for Hard Wordle infrastructure
# Helps track spending and stay within budget

set -e

ENVIRONMENT=${1:-dev}

echo "========================================="
echo "Hard Wordle Cost Monitoring"
echo "Environment: $ENVIRONMENT"
echo "========================================="

# Get current month costs
echo "📊 Current Month Costs:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --query 'ResultsByTime[0].Groups[?Metrics.BlendedCost.Amount>`0`].[Keys[0],Metrics.BlendedCost.Amount]' \
    --output table

echo ""
echo "💰 Total Current Month Cost:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text

echo ""
echo "📈 Last 7 Days Daily Costs:"
aws ce get-cost-and-usage \
    --time-period Start=$(date -d "7 days ago" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity DAILY \
    --metrics BlendedCost \
    --query 'ResultsByTime[].[TimePeriod.Start,Total.BlendedCost.Amount]' \
    --output table

echo ""
echo "🎯 Hard Wordle Specific Resources:"
echo "Checking ECS Service status..."
aws ecs describe-services \
    --cluster ${ENVIRONMENT}-hard-wordle-cluster \
    --services ${ENVIRONMENT}-hard-wordle-service \
    --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
    --output table 2>/dev/null || echo "ECS service not found or not deployed"

echo ""
echo "📦 ECR Repository size:"
aws ecr describe-repositories \
    --repository-names ${ENVIRONMENT}-hard-wordle \
    --query 'repositories[0].repositorySizeInBytes' \
    --output text 2>/dev/null | awk '{print $1/1024/1024 " MB"}' || echo "ECR repository not found"

echo ""
echo "💡 Cost Optimization Tips:"
echo "- Stop ECS service when not in use: aws ecs update-service --cluster ${ENVIRONMENT}-hard-wordle-cluster --service ${ENVIRONMENT}-hard-wordle-service --desired-count 0"
echo "- Start ECS service: aws ecs update-service --cluster ${ENVIRONMENT}-hard-wordle-cluster --service ${ENVIRONMENT}-hard-wordle-service --desired-count 1"
echo "- Monitor costs daily with: aws ce get-cost-and-usage --time-period Start=\$(date +%Y-%m-%d),End=\$(date -d '+1 day' +%Y-%m-%d) --granularity DAILY --metrics BlendedCost"

echo ""
echo "🚨 Set up billing alerts at: https://console.aws.amazon.com/billing/home#/budgets"