/**
 * index
 * get-native.com
 *
 * Created by henryehly on 2017/01/15.
 */


const config = require('./config/application').config;
const k = require('./config/keys.json');

const Promise = require('bluebird');
const logger = require('./config/logger');
const server = require('./config/initializers/server');
const mailer = require('./config/initializers/mailer');
const db = require('./app/models');
const _ = require('lodash');

logger.info(`Initializing ${_.toUpper(config.get(k.ENVIRONMENT))} environment`);

const initPromises = [
    server(), db.sequelize.authenticate(), Promise.promisify(mailer.verify)()
];

if (config.get(k.ENVIRONMENT) === k.Env.Development) {
    const MailDev = require('maildev');
    const mailServer = new MailDev();
    initPromises.push(Promise.promisify(mailServer.listen)());
}

module.exports = Promise.all(initPromises).spread(server => {
    logger.info('Initialization successful');
    return {
        server: server,
        db: db,
        mailer: mailer
    };
}).catch(e => {
    logger.info('Initialization failed:', e, {json: true});
    return e;
});
