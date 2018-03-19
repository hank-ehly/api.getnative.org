/**
 * application
 * api.getnative.org
 *
 * Created by henryehly on 2017/05/22.
 */

const logger = require('./logger');
const k = require('./keys.json');

const nconf = require('nconf');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

function Config() {
    nconf.env([k.API.Port, k.Debug, k.NODE_ENV]).use('memory');
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

    config = _.defaults(config, require('./environments/default'));

    for (let key in config) {
        if (!nconf.get(key)) {
            nconf.set(key, config[key]);
        }
    }

    nconf.set(k.TempDir, fs.mkdtempSync('/tmp/org.getnative.'));
}

Config.prototype.get = function(key) {
    return nconf.get(key);
};

Config.prototype.isDev = function() {
    return [k.Env.Development, k.Env.Test, k.Env.CircleCI].includes(this.get(k.ENVIRONMENT));
};

Config.prototype.isTest = function() {
    return [k.Env.Test, k.Env.CircleCI].includes(this.get(k.ENVIRONMENT));
};

Config.prototype.isProduction = function() {
    return this.get(k.ENVIRONMENT) === k.Env.Production;
};

const config = new Config();

module.exports.config = config;
