#!/bin/bash

# Hard Wordle Docker Cleanup Script
# This script removes all Hard Wordle related Docker containers and images

echo "🧹 Cleaning up Hard Wordle Docker resources..."

# Stop and remove all containers with "hard-wordle" in the name
echo "Stopping and removing Hard Wordle containers..."
docker ps -a --filter "name=hard-wordle" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}" | grep -v "CONTAINER ID" | while read line; do
    if [ ! -z "$line" ]; then
        container_id=$(echo $line | awk '{print $1}')
        container_name=$(echo $line | awk '{print $2}')
        echo "  Stopping container: $container_name ($container_id)"
        docker stop $container_id 2>/dev/null || true
        echo "  Removing container: $container_name ($container_id)"
        docker rm $container_id 2>/dev/null || true
    fi
done

# Remove all images with "hard-wordle" in the name or tag
echo "Removing Hard Wordle images..."
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | grep "hard-wordle" | while read line; do
    if [ ! -z "$line" ]; then
        image_id=$(echo $line | awk '{print $3}')
        repository=$(echo $line | awk '{print $1}')
        tag=$(echo $line | awk '{print $2}')
        echo "  Removing image: $repository:$tag ($image_id)"
        docker rmi $image_id 2>/dev/null || true
    fi
done

# Clean up dangling images (optional - removes unused images)
echo "Cleaning up dangling images..."
dangling_images=$(docker images -f "dangling=true" -q)
if [ ! -z "$dangling_images" ]; then
    echo "  Removing dangling images..."
    docker rmi $dangling_images 2>/dev/null || true
else
    echo "  No dangling images found"
fi

# Show remaining Docker resources
echo ""
echo "📊 Remaining Docker resources:"
echo "Containers:"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""
echo "Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "✅ Docker cleanup complete!"
echo ""
echo "💡 Usage tips:"
echo "  - Run this script before building: ./cleanup-docker.sh"
echo "  - Then build fresh image: docker build -t hard-wordle ."
echo "  - Or use the container test script: ./run-container-selenium-tests.sh"