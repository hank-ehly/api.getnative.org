#!/usr/bin/env bash

set -e

NODE_ENV="development" \
GOOGLE_APPLICATION_CREDENTIALS="config/secrets/gcloud-credentials.json" \
/Users/henryehly/.nvm/versions/node/v8.0.0/bin/node --debug-brk=5859 index.js
