/**
 * sessions
 * api.getnativelearning.com
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

module.exports.create = async (req, res, next) => {
    let user, credential;

    try {
        user = await User.find({
            rejectOnEmpty: true,
            where: {email: req.body[k.Attr.Email]},
            attributes: [
                k.Attr.Id, k.Attr.Email, k.Attr.BrowserNotificationsEnabled, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
                k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
            ]
        });
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.UserNamePasswordIncorrect));
        }
        return next(e);
    }

    try {
        credential = await Credential.find({
            rejectOnEmpty: true,
            where: {user_id: user.get(k.Attr.Id)},
            attributes: [k.Attr.Password]
        });
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.UserNamePasswordIncorrect));
        }
        return next(e);
    }

    if (!Auth.verifyPassword(credential.get(k.Attr.Password), req.body[k.Attr.Password])) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserNamePasswordIncorrect));
    }

    try {
        const token = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
        Auth.setAuthHeadersOnResponseWithToken(res, token);
    } catch (e) {
        return next(e);
    }

    return res.status(201).send(user.get({plain: true}));
};
