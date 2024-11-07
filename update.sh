#!/bin/bash

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

github_url="https://raw.githubusercontent.com/blinko-space/blinko/refs/heads/main/docker-compose.prod.yml"
compose_file="docker-compose.prod.yml"

# echo -e "${YELLOW}1. 🗑 Removing existing blinkospace/blinko Docker image...${NC}"
# docker rmi blinkospace/blinko:latest -f

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to remove Docker image. It may not exist or there may be an issue with Docker.${NC}"
else
  echo -e "${GREEN}Successfully removed Docker image: blinkospace/blinko:latest${NC}"
fi

# Step 2: Fetch docker-compose file using curl
echo -e "${YELLOW}2. ✅ Fetching docker-compose file from GitHub...${NC}"
curl -o $compose_file $github_url

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to download the docker-compose file. Please check your internet connection or the GitHub URL.${NC}"
  exit 1
fi
echo -e "${GREEN}Successfully downloaded docker-compose file: $compose_file${NC}"

# Step 6: Restart the blinko-website service without affecting postgres
echo -e "${YELLOW}6. ⏳ Restarting the blinko-website service...${NC}"
docker-compose -f $compose_file up -d --no-deps blinko-website

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start Docker Compose. Please check the docker-compose file and your Docker setup.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ blinko-website is up and running.${NC}"
