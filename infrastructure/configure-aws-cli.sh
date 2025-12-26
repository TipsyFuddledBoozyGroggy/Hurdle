#!/bin/bash

# Configure AWS CLI to show full output without pagination
# This ensures all AWS CLI commands show complete output without requiring user interaction

echo "Configuring AWS CLI for full output display..."

# Set AWS CLI pager to empty (disables pagination)
export AWS_PAGER=""

# Also set it in the current shell session
aws configure set cli_pager ""

# Add to common shell profiles if they exist
if [ -f ~/.bashrc ]; then
    echo 'export AWS_PAGER=""' >> ~/.bashrc
fi

if [ -f ~/.zshrc ]; then
    echo 'export AWS_PAGER=""' >> ~/.zshrc
fi

echo "✅ AWS CLI configured to show full output without pagination"
echo "💡 You can also add --no-paginate flag to individual commands"
echo "💡 Or set AWS_PAGER=\"\" environment variable"