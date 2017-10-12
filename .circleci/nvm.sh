#!/usr/bin/env bash

export NVM_DIR="$HOME/.nvm"

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash \
    && source ${NVM_DIR}/nvm.sh \
    && nvm install  8.5.0 \
    && npm install -g npm \
    && npm -v
