#!/bin/bash
set +x

if [ $# -ne 1 ]; then
  echo "!!! Need a VERSION to build !!!"
  exit 1
fi

VERSION=$1

podman build --force-rm \
 --tag "docker.io/spogliani/auth-gateway:v${VERSION}" \
 --tag 'docker.io/spogliani/auth-gateway:latest' .
