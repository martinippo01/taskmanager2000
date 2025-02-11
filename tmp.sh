#!/bin/bash

IMAGE_REGISTRY=martinippo
IMAGE_PREFIX=taskmanager2000
DOCKER_DRIVER=overlay2

for service in orquestador scheduler task-service wf-manager; do
  echo "Building $service...";
  echo "$IMAGE_REGISTRY/$IMAGE_PREFIX-$service:latest $service"
done
