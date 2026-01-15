#!/bin/bash

# Build Docker images for production deployment
# Usage: cd scripts && ./tag_build_containers.sh

echo "=========================================="
echo "Building Docker images for PRODUCTION"
echo "=========================================="
echo ""

# Move to parent directory (where service folders are)
cd ../.. || exit 1

services=(react-ystemandchess chessServer middlewareNode stockfishServer)

for service in "${services[@]}"
do
    echo "=========================================="
    echo "Building: $service"
    echo "=========================================="

    if [ ! -d "$service" ]; then
        echo "ERROR: Directory $service not found!"
        exit 1
    fi

    cd $service || exit 1

    # Convert to lowercase for image name
    imagename=$(echo "$service" | awk '{ print tolower($0) }')

    echo "Image name: $imagename"

    # Build Docker image
    docker build -t $imagename . || {
        echo "ERROR: Failed to build $imagename"
        cd ..
        exit 1
    }

    cd ..
    echo "Successfully built $imagename"
    echo ""
done

echo "=========================================="
echo "All production images built!"
echo "=========================================="
echo ""
echo "To deploy:"
echo "  cd scripts"
echo "  docker-compose up -d"