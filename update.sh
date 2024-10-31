#!/bin/bash

# Docker container and image names
docker_image="blinkospace/blinko:latest"
docker_container="blinko-website"

# Default environment variables
NEXTAUTH_URL_DEFAULT="http://localhost:1111"
NEXT_PUBLIC_BASE_URL_DEFAULT="http://localhost:1111"
DATABASE_URL_DEFAULT="postgresql://postgres:mysecretpassword@blinko-postgres:5432/postgres"

# Remove existing Docker image
echo "Removing existing $docker_image Docker image..."
docker rmi $docker_image -f
if [ $? -ne 0 ]; then
  echo "Failed to remove Docker image. It may not exist or there may be an issue with Docker."
else
  echo "Successfully removed Docker image: $docker_image"
fi

# Remove existing Docker container
echo "Removing existing $docker_container container..."
docker rm $docker_container -f
if [ $? -ne 0 ]; then
  echo "Failed to remove Docker container. It may not exist or there may be an issue with Docker."
else
  echo "Successfully removed Docker container: $docker_container"
fi

# Prompt user to change NEXTAUTH_URL if needed
read -p "Do you want to change NEXTAUTH_URL from the default ($NEXTAUTH_URL_DEFAULT)? [y/N]: " change_nextauth_url
if [[ "$change_nextauth_url" == "y" || "$change_nextauth_url" == "Y" ]]; then
  read -p "Enter new NEXTAUTH_URL: " NEXTAUTH_URL
else
  NEXTAUTH_URL=$NEXTAUTH_URL_DEFAULT
fi

# Prompt user to change NEXT_PUBLIC_BASE_URL if needed
read -p "Do you want to change NEXT_PUBLIC_BASE_URL from the default ($NEXT_PUBLIC_BASE_URL_DEFAULT)? [y/N]: " change_next_public_base_url
if [[ "$change_next_public_base_url" == "y" || "$change_next_public_base_url" == "Y" ]]; then
  read -p "Enter new NEXT_PUBLIC_BASE_URL: " NEXT_PUBLIC_BASE_URL
else
  NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL_DEFAULT
fi

# Prompt user to change DATABASE_URL if needed
read -p "Do you want to change DATABASE_URL from the default ($DATABASE_URL_DEFAULT)? [y/N]: " change_database_url
if [[ "$change_database_url" == "y" || "$change_database_url" == "Y" ]]; then
  read -p "Enter new DATABASE_URL: " DATABASE_URL
else
  DATABASE_URL=$DATABASE_URL_DEFAULT
fi

# Run the Docker container with specified environment variables
echo "Starting the Docker container..."
docker run -d \
  --name $docker_container \
  -p 1111:1111 \
  -e NODE_ENV=production \
  -e NEXTAUTH_URL=$NEXTAUTH_URL \
  -e NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
  -e NEXTAUTH_SECRET=my_ultra_secure_nextauth_secret \
  -e JWT_SECRET=MBqmAZqgbe0I66Jx3sFd/nMoU3paITpHznScerTHJNo2 \
  -e DATABASE_URL=$DATABASE_URL \
  --link blinko-postgres:postgres \
  $docker_image

if [ $? -ne 0 ]; then
  echo "Failed to start Docker container. Please check your Docker setup."
  exit 1
fi

echo "Docker container is up and running."
