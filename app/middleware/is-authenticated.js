/**
 * auth-optional
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/08/03.
 */

const GetNativeError = require('../services/get-native-error');
const k = require('../../config/keys.json');

module.exports = async (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401);
    return next(new GetNativeError(k.Error.Auth));
};
