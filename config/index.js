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
const path    = require('path');
const fs      = Promise.promisifyAll(require('fs'));
const _       = require('lodash');

function Config() {
    nconf.env([k.API.Port, k.Debug, k.NODE_ENV]).use('memory');

    /* Normalized run-environment value */
    nconf.set(k.ENVIRONMENT, _.toLower(nconf.get(k.NODE_ENV) || k.Env.Development));

    let config = {};

    try {
        config = require(path.resolve(__dirname, 'environments', nconf.get(k.ENVIRONMENT)));
    } catch (e) {
        if (_.isError(e) && e.code === 'MODULE_NOT_FOUND') {
            logger.info(`${_.capitalize(nconf.get(k.ENVIRONMENT))} environment configuration file missing. Ignoring.`);
        } else {
            throw e;
        }
    }

    config = _.defaults(config, require(path.resolve(__dirname, 'environments', 'default')));

    for (let key in config) {
        nconf.set(key, config[key]);
    }

    const promises = [];

    promises.push([
        fs.readFileAsync(path.resolve(__dirname, 'secrets', 'id_rsa'), 'utf8'),
        fs.readFileAsync(path.resolve(__dirname, 'secrets', 'id_rsa.pem'), 'utf8')
    ]);

    if (!_.includes([k.Env.CircleCI, k.Env.Test], nconf.get(k.ENVIRONMENT))) {
        promises.push(fs.readFileAsync(path.resolve(__dirname, 'secrets', 'gcloud-credentials.json')))
    }

    Promise.all(promises).spread((privateKey, publicKey) => {
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
