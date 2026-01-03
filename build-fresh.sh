#!/bin/bash

# Fresh Docker Build Script for Hard Wordle
# Cleans up existing resources and builds a fresh image

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Hard Wordle: Fresh Docker Build${NC}"
echo -e "${BLUE}=================================${NC}"

# Step 1: Clean up existing Docker resources
echo -e "${GREEN}Step 1: Cleaning up existing Docker resources...${NC}"
./cleanup-docker.sh

# Step 2: Build fresh Docker image
echo -e "\n${GREEN}Step 2: Building fresh Docker image...${NC}"
docker build -t hard-wordle .

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Fresh Docker image built successfully!${NC}"
    echo -e "${BLUE}💡 You can now run:${NC}"
    echo -e "${BLUE}   docker run -p 80:80 hard-wordle${NC}"
    echo -e "${BLUE}   or${NC}"
    echo -e "${BLUE}   ./run-container-selenium-tests.sh${NC}"
else
    echo -e "\n${RED}❌ Docker build failed!${NC}"
    exit 1
fi