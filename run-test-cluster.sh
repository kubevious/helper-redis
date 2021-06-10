#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

getIp() {
  docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' redis-cluster_$1_1
}

# export DEBUG=ioredis:* 

export REDIS_CLUSTER=true

export REDIS_HOST_1=localhost
export REDIS_PORT_1=6479
export REDIS_NAT_1=$(getIp redis-node-0):6379

export REDIS_HOST_2=localhost
export REDIS_PORT_2=6480
export REDIS_NAT_2=$(getIp redis-node-1):6379

export REDIS_HOST_3=localhost
export REDIS_PORT_3=6481
export REDIS_NAT_3=$(getIp redis-node-2):6379

export REDIS_HOST_4=localhost
export REDIS_PORT_4=6482
export REDIS_NAT_4=$(getIp redis-node-3):6379

export REDIS_HOST_5=localhost
export REDIS_PORT_5=6483
export REDIS_NAT_5=$(getIp redis-node-4):6379

export REDIS_HOST_6=localhost
export REDIS_PORT_6=6484
export REDIS_NAT_6=$(getIp redis-node-5):6379

echo "SETUP USING: ./redis-cluster/start.sh"

npm test $@