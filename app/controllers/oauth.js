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

module.exports.callback = async (req, res, next) => {
    let jsonWebToken;

    try {
        jsonWebToken = await Auth.generateTokenForUserId(req.user.get(k.Attr.Id));
    } catch (e) {
        return next(e);
    }

    if (!jsonWebToken) {
        throw new ReferenceError('variable jsonWebToken is undefined');
    }

    const tokenExpirationDate = moment().add(1, 'hours').valueOf().toString();
    const redirectUrl = `${config.get(k.Client.BaseURI)}/oauth/callback?token=${jsonWebToken}&expires=${tokenExpirationDate}`;

    res.redirect(redirectUrl);
};
