#!/bin/bash
. .env
mongod --config $MONGODB_CONFIG --fork &
redis-server $REDIS_CONFIG &
tsc -w &
