/**
 * authenticate
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/11.
 */

const services = require('../services');
const Auth = services['Auth'];
const GetNativeError = services['GetNativeError'];
const k = require('../../config/keys.json');

const passport = require('passport');

module.exports = (req, res, next) => {
    return Auth.validateRequest(req).then(token => {
        return Auth.refreshToken(token);
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token); // todo: make a separate middleware
        next();
    }).catch(e => {
        res.status(401);
        next(new GetNativeError(k.Error.JWT));
    });
};
