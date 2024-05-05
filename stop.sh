#!/bin/bash

mongo --eval "db.getSiblingDB('admin').shutdownServer()"
redis-cli shutdown
