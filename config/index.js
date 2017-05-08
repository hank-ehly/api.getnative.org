/**
 * config
 * get-native.com
 *
 * Created by henryehly on 2017/04/04.
 */

const logger  = require('./logger');
const k       = require('./keys.json');

const Promise = require('bluebird');
const nconf   = require('nconf');
const fs      = Promise.promisifyAll(require('fs'));
const _       = require('lodash');

function Config() {
    nconf.env([k.API.Port, k.Debug, k.NODE_ENV]).use('memory');

    /* Main app environment */
    nconf.set(k.ENVIRONMENT, _.toLower(nconf.get(k.NODE_ENV) || k.Env.Development));

    let config = {};

    try {
        config = require(`${__dirname}/environments/${nconf.get(k.ENVIRONMENT)}`);
    } catch (e) {
        if (_.isError(e) && e.code === 'MODULE_NOT_FOUND') {
            logger.info(`${_.capitalize(nconf.get(k.ENVIRONMENT))} environment configuration file is not present. Ignoring.`);
        } else {
            throw e;
        }
    }

    config = _.defaults(config, require(`${__dirname}/environments/default`));

    for (let key in config) {
        nconf.set(key, config[key]);
    }

    const readPrivateKey = fs.readFileAsync(__dirname + '/secrets/id_rsa', 'utf8');
    const readPublicKey  = fs.readFileAsync(__dirname + '/secrets/id_rsa.pem', 'utf8');

    Promise.join(readPrivateKey, readPublicKey, (privateKey, publicKey) => {
        nconf.set(k.PrivateKey, privateKey);
        nconf.set(k.PublicKey, publicKey);
    }).catch(e => {
        throw e;
    });
}

Config.prototype.get = function(key) {
    return nconf.get(key);
};

const config = new Config();

module.exports = config;
