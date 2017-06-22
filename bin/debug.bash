#!/usr/bin/env bash

set -e

NODE_ENV="development" \
GOOGLE_APPLICATION_CREDENTIALS="config/secrets/gcloud-credentials.json" \
/usr/bin/env node --inspect-brk=5858 index.js
