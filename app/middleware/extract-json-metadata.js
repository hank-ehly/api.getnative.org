/**
 * extract-json-metadata
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/26.
 */

const GetNativeError = require('../services')['GetNativeError'];
const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = (req, res, next) => {
    if (!_.has(req.body, 'metadata')) {
        res.status(400);
        return next(new GetNativeError(k.Error.MetadataMissing));
    }

    try {
        let metadata = JSON.parse(req.body['metadata']);
        _.assign(req.body, metadata);
        delete req.body['metadata'];
    } catch (e) {
        res.status(400);
        return next(new GetNativeError(k.Error.MetadataFormat));
    }

    next();
};
