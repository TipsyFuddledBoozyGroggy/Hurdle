#!/bin/bash

# Script to help authorize the GitHub CodeStar connection
# This will open the AWS Console page where you can complete the authorization

CONNECTION_ARN="arn:aws:codestar-connections:us-east-1:864899864715:connection/4d4599b3-2785-4c7b-b980-9a3f5ea40caf"
REGION="us-east-1"

echo "========================================="
echo "GitHub CodeStar Connection Authorization"
echo "========================================="
echo ""
echo "Connection ARN: $CONNECTION_ARN"
echo "Status: PENDING (needs GitHub authorization)"
echo ""
echo "To complete the authorization:"
echo "1. Go to AWS Console → CodePipeline → Settings → Connections"
echo "2. Find connection: hard-wordle-github-connection"
echo "3. Click 'Update pending connection'"
echo "4. Authorize AWS to access your GitHub account"
echo ""
echo "Or use this direct link:"
echo "https://console.aws.amazon.com/codesuite/settings/connections?region=$REGION"
echo ""

# Try to open the URL if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening AWS Console..."
    open "https://console.aws.amazon.com/codesuite/settings/connections?region=$REGION"
fi

echo "After authorization, the connection status will change to 'Available'"
echo "Then you can deploy the infrastructure with: ./infrastructure/deploy.sh dev"