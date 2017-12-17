/**
 * validate-request-parameters
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/20.
 */

const GetNativeError = require('../services/get-native-error');
const k = require('../../config/keys.json');

const Joi = require('joi');
const _ = require('lodash');

const options = {
    'abortEarly': false,
    'allowUnknown': true
};

module.exports = function(schema) {
    if (!schema) {
        throw new Error('No schema found!');
    }

    return function(req, res, next) {
        let errors = [];

        if (schema.headers && schema.headers.authorization) {
            let x = false;
            let m = '';
            Joi.validate(req.headers, schema.headers, options, error => {
                if (!error) {
                    return;
                }

                for (let i = 0; i < error.details.length; i++) {
                    let detail = error.details[i];
                    if (_.first(detail.path) === 'authorization') {
                        x = true;
                        m = detail.message;
                    }
                }
            });

            if (x) {
                res.status(401);
                return next(new GetNativeError(k.Error.Auth, m));
            }
        }

        ['headers', 'body', 'query', 'params', 'files'].forEach(key => {
            if (!schema[key]) {
                return;
            }

            Joi.validate(req[key], schema[key], options, error => {
                if (!error) {
                    return;
                }

                let details = error.details.map(obj => {
                    return new GetNativeError(k.Error.RequestParam, obj.message);
                });

                errors = _.concat(errors, details);
            });
        });

        if (_.gt(errors.length, 0)) {
            res.status(400);
            return next(errors);
        }

        return next();
    }
};
