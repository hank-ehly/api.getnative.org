/**
 * extract-json-metadata
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/26.
 */

const _ = require('lodash');

module.exports = (req, res, next) => {
    if (!_.has(req.body, 'metadata')) {
        return next();
    }

    try {
        let metadata = JSON.parse(req.body['metadata']);
        _.assign(req.body, metadata);
        delete req.body['metadata'];
    } catch (e) {
        return next(e);
    }

    next();
};
