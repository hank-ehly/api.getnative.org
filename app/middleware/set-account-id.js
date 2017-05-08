/**
 * set-account-id
 * get-native.com
 *
 * Created by henryehly on 2017/04/21.
 */

const logger         = require('../../config/logger');
const services       = require('../services');
const GetNativeError = services.GetNativeError;
const Auth           = services.Auth;
const k              = require('../../config/keys.json');

const _    = require('lodash');

module.exports = (req, res, next) => {
    if (req.headers && req.headers.authorization) {
        const accountId = Auth.extractAccountIdFromRequest(req);

        logger.info('Account ID:', accountId);

        if (!accountId) {
            res.status(422);
            next(new GetNativeError(k.Error.JWT));
        }

        _.assign(req, {
            accountId: accountId
        });
    }
    next();
};
