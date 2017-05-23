/**
 * oauth
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const logger = require('../../config/logger');
const Auth   = require('../services')['Auth'];
const config = require('../../config/application').config;
const k      = require('../../config/keys.json');

const moment = require('moment');

module.exports.facebookCallback = (req, res, next) => {
    const userId = req.user.get(k.Attr.Id);
    return Auth.generateTokenForUserId(userId).then(token => {
        const tokenExpirationDate = moment().add(1, 'hours').valueOf().toString();
        const redirectUrl = `${config.get(k.Client.BaseURI)}/oauth/facebook?token=${token}&expires=${tokenExpirationDate}`;
        res.redirect(redirectUrl);
    }).catch(next);
};
