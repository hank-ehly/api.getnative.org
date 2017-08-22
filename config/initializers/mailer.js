/**
 * mailer
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/26.
 */

const config = require('../application').config;
const k      = require('../keys.json');

const mailer = require('nodemailer');
const _      = require('lodash');

const smtpConfig = {
    host: config.get(k.SMTP.Host),
    port: config.get(k.SMTP.Port)
};

if (_.includes([k.Env.Development, k.Env.Test, k.Env.CircleCI], config.get(k.ENVIRONMENT))) {
    _.assign(smtpConfig, {
        tls: {
            rejectUnauthorized: false
        }
    });
}

const transport = mailer.createTransport(smtpConfig);

module.exports = transport;
