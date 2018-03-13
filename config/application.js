/**
 * application
 * api.getnativelearning.com
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

    function loadENVVars() {
        nconf.env([k.API.Port, k.Debug, k.NODE_ENV]).use('memory');
        nconf.set(k.ENVIRONMENT, _.toLower(nconf.get(k.NODE_ENV) || k.Env.Development));
    }

    function loadAppConfig() {
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
    }

    function loadSecrets() {
        if (!_.includes([k.Env.CircleCI, k.Env.Test], nconf.get(k.ENVIRONMENT))) {
            nconf.set(k.GoogleCloud.KeyFilename, path.resolve(__dirname, 'secrets', 'gcloud-credentials.json'));
        }

        const jwtKeys = require('./secrets/jwt-keypair.json');
        nconf.set(k.PrivateKey, jwtKeys.private);
        nconf.set(k.PublicKey, jwtKeys.public);

        try {
            const googleAPIKey = require('./secrets/google_api_keys.json')[nconf.get(k.ENVIRONMENT)];
            nconf.set(k.GoogleCloud.APIKey, googleAPIKey);
        } catch (e) {
            logger.info('Error occurred when loading google api key.');
        }

        try {
            const mailchimpConfig = require('./secrets/mailchimp.json');
            const mailChimpAPIKey = _.get(mailchimpConfig, [nconf.get(k.ENVIRONMENT), 'apiKey'].join('.'));
            const mailChimpNewsletterList = _.get(mailchimpConfig, [nconf.get(k.ENVIRONMENT), 'lists', 'newsletter'].join('.'));

            nconf.set(k.MailChimp.APIKey, mailChimpAPIKey);
            nconf.set(k.MailChimp.List.Newsletter, mailChimpNewsletterList);
        } catch (e) {
            logger.info('Failed to load mailchimp api key and/or list ids.');
            logger.info(e, {json: true});
        }

        try {
            const sendGridAPIKey = require('./secrets/sendgrid.json')[nconf.get(k.ENVIRONMENT)];
            nconf.set(k.SendGrid.APIKey, sendGridAPIKey);
        } catch (e) {
            logger.info('Failed to load sendgrid api key.');
        }
    }

    function setupTempDir() {
        nconf.set(k.TempDir, fs.mkdtempSync('/tmp/com.getnativelearning.'));
    }

    function __construct() {
        loadENVVars();
        loadAppConfig();
        loadSecrets();
        setupTempDir();
    }

    __construct();
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

const config = new Config();

module.exports.config = config;
