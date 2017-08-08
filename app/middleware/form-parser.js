/**
 * form-parser
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/22.
 */

const GetNativeError = require('../services')['GetNativeError'];
const k = require('../../config/keys.json');

const formidable = require('formidable');
const _ = require('lodash');

module.exports = (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }

        _.assign(req.body, fields);
        _.set(req, 'files', files);

        next();
    });
};
