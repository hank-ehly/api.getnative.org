/**
 * oauth
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/12.
 */

const Auth = require('../services/auth');
const config = require('../../config/application').config;
const k = require('../../config/keys.json');
const db = require('../models');

const moment = require('moment');
const url = require('url');

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

    let pathname = 'dashboard';
    if ([k.Env.Staging, k.Env.Production].includes(config.get(k.ENVIRONMENT))) {
        pathname = [req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code), '/', pathname].join('');
    }

    const redirectUrl = url.format({
        protocol: config.get(k.Client.Protocol),
        host: config.get(k.Client.Host),
        pathname: pathname,
        query: {
            token: jsonWebToken,
            expires: moment().add(1, 'hours').valueOf().toString()
        }
    });

    res.redirect(redirectUrl);
};
