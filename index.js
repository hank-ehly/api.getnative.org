/**
 * index
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/15.
 */


const config = require('./config/application').config;
const k = require('./config/keys.json');

const logger = require('./config/logger');
const server = require('./config/initializers/server');
const mailer = require('./config/initializers/mailer');
const db = require('./app/models');

logger.info(`Initializing ${config.get(k.ENVIRONMENT).toUpperCase()} environment`);

const initPromises = [server(), db.sequelize.authenticate(), new Promise(mailer.verify)];

if (config.get(k.ENVIRONMENT) === k.Env.Development) {
    const MailDev = require('maildev');
    const mailServer = new MailDev();
    initPromises.push(new Promise(mailServer.listen));
}

module.exports = Promise.all(initPromises).then(values => {
    const [server] = values;
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
