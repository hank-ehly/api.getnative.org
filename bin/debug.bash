#!/usr/bin/env bash

set -e

NODE_ENV="development" \
GOOGLE_APPLICATION_CREDENTIALS="config/secrets/gcloud-credentials.json" \
/usr/bin/env node --debug-brk=5859 index.js
