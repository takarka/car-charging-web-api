#!/bin/sh
cd "$(dirname "$0")"
docker-compose stop webserver
docker-compose up --force-recreate --no-deps certbot
sleep 15
docker-compose up -d --force-recreate --no-deps webserver
