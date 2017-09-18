#!/usr/bin/env bash

export NVM_DIR="$HOME/.nvm"

NODE_VERSION=`cat ../.nvmrc`

mv .nvmrc .nvmrc.bak \
    && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.4/install.sh | bash \
    && source ${NVM_DIR}/nvm.sh \
    && mv .nvmrc.bak .nvmrc \
    && nvm install ${NODE_VERSION} \
    && npm install -g npm
