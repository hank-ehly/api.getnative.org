/**
 * oauth
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const Auth = require('../services/auth');
const config = require('../../config/application').config;
const k = require('../../config/keys.json');
const db = require('../models');

const moment = require('moment');
const querystring = require('querystring');

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

    const query = querystring.stringify({
        token: jsonWebToken,
        expires: moment().add(1, 'hours').valueOf().toString()
    });

    const preferredInterfaceLangCode = req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code);
    const redirectUrl = [config.get(k.Client.BaseURI), '/', 'dashboard', '?', query].join('');

    res.redirect(redirectUrl);
};
