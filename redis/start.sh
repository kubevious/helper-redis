#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

docker-compose up -d --build

echo "Redis Listening on: 5179"
echo "Redis UI: http://localhost:5180"