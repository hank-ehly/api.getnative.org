/**
 * mailer
 * get-native.com
 *
 * Created by henryehly on 2017/03/26.
 */

const config = require('../index');
const k      = require('../keys.json');

const mailer = require('nodemailer');
const _      = require('lodash');

const smtpConfig = {
    host: config.get(k.SMTP.Host),
    port: config.get(k.SMTP.Port)
};

if (_.includes([k.Env.Development, k.Env.Test, k.Env.CircleCI], config.get(k.NODE_ENV))) {
    _.assign(smtpConfig, {
        secure: false, // defaults to false
        tls: {
            rejectUnauthorized: false
        }
    });
}

const transport = mailer.createTransport(smtpConfig);

module.exports = transport;
