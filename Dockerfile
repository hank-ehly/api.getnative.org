FROM ruby:2.3

ENV NVM_DIR $HOME/.nvm
ENV NODE_VERSION 8.9.3

RUN apt-get update && apt-get install -y build-essential libav-tools

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash \
        && . ${NVM_DIR}/nvm.sh \
        && nvm install ${NODE_VERSION} \
        && npm install -g npm pm2

RUN ln -s /.nvm/versions/node/v${NODE_VERSION}/bin/node /usr/local/bin/node
RUN ln -s /.nvm/versions/node/v${NODE_VERSION}/bin/npm /usr/local/bin/npm