#!/bin/bash

IMAGE_NAME="taskplanner-ui"
TAG="v1.0.5"
DOCKERHUB_NAME="romanv79"

FULL_NAME="${DOCKERHUB_NAME}/${IMAGE_NAME}:${TAG}"

docker build -t "${FULL_NAME}" .
docker push "${FULL_NAME}"