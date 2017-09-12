FROM node:latest
EXPOSE 3000
WORKDIR /var/www/api.getnativelearning.com
RUN apt-get update && apt-get install -y build-essential libav-tools
RUN npm install -g pm2
CMD \
    .circleci/generate-jwt-keypair.sh && \
    cp -fp config/database.json.template config/database.json && \
    npm install && \
    NODE_ENV=test npm run sequelize db:migrate:undo:all && \
    NODE_ENV=test npm run sequelize db:migrate && \
    NODE_ENV=development npm run sequelize db:migrate:undo:all && \
    NODE_ENV=development npm run sequelize db:migrate && \
    NODE_ENV=development npm run sequelize db:seed:all && \
    NODE_ENV=development npm start
