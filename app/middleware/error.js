/**
 * error
 * get-native.com
 *
 * Created by henryehly on 2017/03/13.
 */

const GetNativeError = require('../services').GetNativeError;
const config         = require('../../config');
const logger         = require('../../config/logger');
const k              = require('../../config/keys.json');

const _              = require('lodash');

module.exports.logErrors = function(e, req, res, next) {
    logger.info(e, {json: true});
    next(e);
};

/*
* All client error responses have the following format:
*
*     [ ErrorObject, ErrorObject, ... ]
*
* An ErrorObject is the following format:
*
*     { message: <String> }
* */
module.exports.clientErrorHandler = function(e, req, res, next) {
    if (e instanceof GetNativeError || (_.isArray(e) && _.first(e) instanceof GetNativeError)) {
        res.json(_.castArray(e));
    } else {
        next(e);
    }
};

module.exports.fallbackErrorHandler = function(error, req, res) {
    if (config.get(k.API.ENV) !== k.Env.Production) {
        return res.status(500).send(error.stack);
    }

    // todo: if error is result of non-existent request path, send 404

    return res.sendStatus(500);
};
