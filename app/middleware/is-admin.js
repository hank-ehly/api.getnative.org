/**
 * admin-only
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/29.
 */

const GetNativeError = require('../services')['GetNativeError'];
const k = require('../../config/keys.json');

module.exports = async (req, res, next) => {
    if (await req.user.isAdmin()) {
        return next();
    }
    res.status(404);
    return next(new GetNativeError(k.Error.ResourceNotFound));
};
