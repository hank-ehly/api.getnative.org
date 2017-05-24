#!/usr/bin/env bash

NODE_ENV="development" \
GOOGLE_APPLICATION_CREDENTIALS="config/secrets/gcloud-credentials.json" \
/Users/henryehly/.nvm/versions/node/v7.10.0/bin/node --debug-brk=5859 index.js
