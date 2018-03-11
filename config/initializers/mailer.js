/**
 * mailer
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/26.
 */

const config = require('../application').config;
const k = require('../keys.json');

const mailer = require('nodemailer');
const _ = require('lodash');

let transportConfig = {
    host: config.get(k.SMTP.Host),
    port: config.get(k.SMTP.Port),
    tls: {
        rejectUnauthorized: false
    }
};

if (config.get(k.ENVIRONMENT) === k.Env.Production) {
    const nodemailerSendGrid = require('nodemailer-sendgrid');
    const apiKey = config.get(k.SendGrid.APIKey);
    transportConfig = nodemailerSendGrid({apiKey: apiKey});
} else if (config.get(k.ENVIRONMENT) === k.Env.Staging) {
    _.assign(transportConfig, {
        auth: {
            user: config.get(k.SMTP.Auth.User),
            pass: config.get(k.SMTP.Auth.Pass)
        }
    });
}

const transport = mailer.createTransport(transportConfig);

module.exports = transport;
