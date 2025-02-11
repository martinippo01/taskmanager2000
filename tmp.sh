#!/bin/bash
IMAGE_REGISTRY=martinippo
IMAGE_PREFIX=taskmanager2000
DOCKER_DRIVER=overlay2

for service in orquestador scheduler task-service wf-manager; do
  echo "Building $service...";
  cd $service;
  tar -czh . | docker build - -t $IMAGE_REGISTRY/$IMAGE_PREFIX-$service:latest;
  docker tag $IMAGE_REGISTRY/$IMAGE_PREFIX-$service:latest $IMAGE_REGISTRY/$IMAGE_PREFIX-$service:local;
  echo "Pushing $service...";
  docker push $IMAGE_REGISTRY/$IMAGE_PREFIX-$service:latest;
  docker push $IMAGE_REGISTRY/$IMAGE_PREFIX-$service:local;
  cd ..;
done
