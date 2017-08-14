#!/usr/bin/env bash

export NVM_DIR="$HOME/.nvm"

mv .nvmrc .nvmrc.bak \
    && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash \
    && source ${NVM_DIR}/nvm.sh \
    && mv .nvmrc.bak .nvmrc \
    && nvm install 8.3.0 \
    && npm install -g npm
echo $PATH
echo $$
