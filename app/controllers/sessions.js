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
module.exports.create = (req, res, next) => {
    let cache = {};

    return User.find({
        where: {
            email: req.body[k.Attr.Email]
        },
        attributes: [
            k.Attr.Id,
            k.Attr.Email,
            k.Attr.BrowserNotificationsEnabled,
            k.Attr.EmailNotificationsEnabled,
            k.Attr.EmailVerified,
            k.Attr.PictureUrl,
            k.Attr.IsSilhouettePicture
        ]
    }).then(user => {
        if (!user) {
            throw new GetNativeError(k.Error.UserNamePasswordIncorrect);
        }

        cache.user = user;

        return Credential.find({
            where: {
                user_id: user.get(k.Attr.Id)
            },
            attributes: [
                k.Attr.Password
            ]
        });
    }).then(credential => {
        if (!credential || !Auth.verifyPassword(credential.get(k.Attr.Password), req.body[k.Attr.Password])) {
            throw new GetNativeError(k.Error.UserNamePasswordIncorrect);
        }

        return Auth.generateTokenForUserId(cache.user.get(k.Attr.Id));
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        res.status(201).send(cache.user.get({plain: true}));
    }).catch(GetNativeError, e => {
        res.status(404);
        next(e);
    }).catch(next);
};
