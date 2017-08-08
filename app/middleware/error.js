/**
 * error
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/13.
 */

const GetNativeError = require('../services')['GetNativeError'];
const config         = require('../../config/application').config;
const logger         = require('../../config/logger');
const k              = require('../../config/keys.json');

const _              = require('lodash');

module.exports.logErrors = function(e, req, res, next) {
    logger.info(e, {json: true});
    next(e);
};

module.exports.clientErrorHandler = function(e, req, res, next) {
    if (e instanceof GetNativeError || (_.isArray(e) && _.first(e) instanceof GetNativeError)) {
        res.json(_.castArray(e));
    } else {
        next(e);
    }
};

module.exports.fallbackErrorHandler = function(e, req, res, next) {
    if (config.get(k.ENVIRONMENT) !== k.Env.Production) {
        return res.status(500).send(e.stack);
    }

    return res.sendStatus(500);
};
