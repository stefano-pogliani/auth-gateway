#!/bin/bash
#  Entrypoint script for AuthGateway docker (mainly for demos).

# Set config defaults.
export ALLOWED_EMAILS=${ALLOWED_EMAILS-""}
export AUDITOR_PROVIDER=${AUDITOR_PROVIDER-"console"}
export APPS_FILE=${APPS_FILE-"/authgateway/apps.yaml"}
export GATEWAY_DOMAIN=${GATEWAY_DOMAIN-"corp.localhost"}

# Generate config and emails files.
cat auth-gateway.template.yaml | envsubst > auth-gateway.yaml
cat "${APPS_FILE}" >> auth-gateway.yaml
echo -en "${ALLOWED_EMAILS}" > allow.emails

# Run the server.
npm run auth-gateway run
