## run docker image on server
### export env variables for docker
```
export POSTGRES_USER=postgres
```
### export env variables for docker
```
export POSTGRES_PASSWORD=mysecretpassword
```
### run docker config for docker
```
docker-compose -f docker-compose.prod.yml up -d
```

## build docker with dockerfile locally
```
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=mysecretpassword
docker build -t blinko .
docker run --name blinko-website -d -p 1111:1111 blinko
```

## test docker with dockerfile locally
```
docker build -t blinko .
docker-compose -f docker-compose.test.yml up -d
```

## build docker image & run with docker-compose locally
```
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=mysecretpassword
docker-compose -f docker-compose.yml up -d --build
```
