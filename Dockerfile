FROM node:latest
EXPOSE 3000
WORKDIR /var/www/api.getnativelearning.com
RUN apt-get update && apt-get install -y build-essential libav-tools
RUN npm install -g pm2
CMD \
    .circleci/generate-jwt-keypair.sh && \
    cp -fp config/database.json.template config/database.json && \
    npm install && \
    ([ ! -z $RESET_DB ] && npm run sequelize db:migrate:undo:all || echo 'skipping npm run sequelize db:migrate:undo:all') && \
    ([ ! -z $RESET_DB ] && npm run sequelize db:migrate || echo 'skipping npm run sequelize db:migrate') && \
    ([ ! -z $RESET_DB ] && npm run sequelize db:seed:all || echo 'skipping npm run sequelize db:seed:all') && \
    npm start
