#!/bin/bash

# set GitHub URL for the docker-compose file
github_url="https://raw.githubusercontent.com/blinko-space/blinko/refs/heads/main/docker-compose.prod.yml"
compose_file="docker-compose.prod.yml"

# Fetch docker-compose file using curl
echo "Fetching docker-compose file from GitHub..."
curl -o $compose_file $github_url

if [ $? -ne 0 ]; then
  echo "Failed to download the docker-compose file. Please check your internet connection or the GitHub URL."
  exit 1
fi

echo "Successfully downloaded docker-compose file: $compose_file"

# Default environment variables
NEXTAUTH_URL_DEFAULT="http://localhost:1111"
NEXT_PUBLIC_BASE_URL_DEFAULT="http://localhost:1111"

# Ask user if they want to change NEXTAUTH_URL
read -p "Do you want to change NEXTAUTH_URL from the default ($NEXTAUTH_URL_DEFAULT)? [y/N]: " change_nextauth_url
if [[ "$change_nextauth_url" == "y" || "$change_nextauth_url" == "Y" ]]; then
  read -p "Enter new NEXTAUTH_URL: " NEXTAUTH_URL
else
  NEXTAUTH_URL=$NEXTAUTH_URL_DEFAULT
fi



# Ask user if they want to change NEXT_PUBLIC_BASE_URL
read -p "Do you want to change NEXT_PUBLIC_BASE_URL from the default ($NEXT_PUBLIC_BASE_URL_DEFAULT)? [y/N]: " change_next_public_base_url
if [[ "$change_next_public_base_url" == "y" || "$change_next_public_base_url" == "Y" ]]; then
  read -p "Enter new NEXT_PUBLIC_BASE_URL: " NEXT_PUBLIC_BASE_URL
else
  NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL_DEFAULT
fi

# Update the docker-compose file with the chosen environment variables
echo "Updating environment variables in $compose_file..."
sed -i "s|NEXTAUTH_URL:.*|NEXTAUTH_URL: $NEXTAUTH_URL|" $compose_file
sed -i "s|NEXT_PUBLIC_BASE_URL:.*|NEXT_PUBLIC_BASE_URL: $NEXT_PUBLIC_BASE_URL|" $compose_file

echo "Environment variables updated."

# Run the docker-compose file
echo "Starting the Docker Compose setup..."
docker-compose -f $compose_file up -d

if [ $? -ne 0 ]; then
  echo "Failed to start Docker Compose. Please check the docker-compose file and your Docker setup."
  exit 1
fi

echo "Docker Compose is up and running."
