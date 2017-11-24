FROM ruby:2.3
RUN apt-get update && apt-get install -y build-essential libav-tools
ENV NVM_DIR $HOME/.nvm
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash \
        && . ${NVM_DIR}/nvm.sh \
        && nvm install 8.9.1 \
        && npm install -g npm pm2