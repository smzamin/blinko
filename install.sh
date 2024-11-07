#!/bin/bash

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set GitHub URL for the docker-compose file
github_url="https://raw.githubusercontent.com/blinko-space/blinko/refs/heads/main/docker-compose.prod.yml"
compose_file="docker-compose.prod.yml"

# Step 0: Prompt user to enter volume path or skip
echo -e "${YELLOW}Do you want to set a volume path for storing .blinko data? (y/n)${NC}"
read set_volume

if [ "$set_volume" = "y" ]; then
    echo -e "${YELLOW}Enter the path where you want to store .blinko data:${NC}"
    read volume_path
fi

# Step 1: Fetch docker-compose file using curl
echo -e "${YELLOW}1. ✅ Fetching docker-compose file from GitHub...${NC}"
# curl -o $compose_file $github_url

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to download the docker-compose file. Please check your internet connection or the GitHub URL.${NC}"
  exit 1
fi
echo -e "${GREEN}Successfully downloaded docker-compose file: $compose_file${NC}"

# Step 2: Update docker-compose file to include the volume if set by user
if [ "$set_volume" = "y" ]; then
    echo -e "${YELLOW}2. 🔄 Updating docker-compose file to include volume for .blinko...${NC}"

    # Ensure the 'volumes' section is correctly indented
    awk -v path="$volume_path" '
    /blinko-website:/ { print; print "    volumes:"; print "      - " path ":/app/.blinko"; next }
    { print }
    ' $compose_file > temp.yml && mv temp.yml $compose_file

    echo -e "${GREEN}Volume configuration added to docker-compose file.${NC}"
fi

# Step 3: Run the docker-compose file
echo -e "${YELLOW}3. ⏳ Starting the Docker Compose setup...${NC}"
docker-compose -f $compose_file up -d

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start Docker Compose. Please check the docker-compose file and your Docker setup.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker Compose is up and running.${NC}"
