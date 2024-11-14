### run docker config for docker
```
docker-compose -f docker-compose.prod.yml up -d
```

## build docker with dockerfile locally
```
docker build -t blinko .
docker run --name blinko-website -d -p 1111:1111 blinko
```

## build docker image & run with docker-compose locally
```
docker-compose -f docker-compose.yml up -d --build
```