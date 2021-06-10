#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

docker network create helper-redis

docker-compose up -d --build

echo "Redis Cluster Listening on: 6479-6484"
echo "Redis Commander UI: http://localhost:5180"