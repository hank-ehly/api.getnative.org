/**
 * sessions
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/10.
 */

const services = require('../services');
const Auth = services['Auth'];
const GetNativeError = services['GetNativeError'];
const k = require('../../config/keys.json');
const db = require('../models');
const Credential = db[k.Model.Credential];
const User = db[k.Model.User];

// todo: handle a user with non-local identity trying to create session
module.exports.create = async (req, res, next) => {
    let user, credential, token;

    try {
        user = await User.find({
            where: {email: req.body[k.Attr.Email]},
            attributes: [
                k.Attr.Id, k.Attr.Email, k.Attr.BrowserNotificationsEnabled, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
                k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
            ]
        });
    } catch (e) {
        return next(e);
    }

    if (!user) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserNamePasswordIncorrect));
    }

    try {
        credential = await Credential.find({
            where: {user_id: user.get(k.Attr.Id)},
            attributes: [k.Attr.Password]
        });
    } catch (e) {
        return next(e);
    }

    if (!credential || !Auth.verifyPassword(credential.get(k.Attr.Password), req.body[k.Attr.Password])) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserNamePasswordIncorrect));
    }

    try {
        token = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
    } catch (e) {
        return next(e);
    }

    if (!token) {
        throw new ReferenceError('variable token is undefined');
    }

    Auth.setAuthHeadersOnResponseWithToken(res, token);

    user = user.get({
        plain: true
    });

    return res.status(201).send(user);
};
