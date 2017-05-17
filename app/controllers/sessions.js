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
const Language = db[k.Model.Language];

module.exports.create = (req, res, next) => {
    return Credential.findOne({
        where: {email: req.body[k.Attr.Email]},
        attributes: [k.Attr.Email, k.Attr.Password, k.Attr.UserId]
    }).then(credential => {
        if (!credential || !Auth.verifyPassword(credential.get(k.Attr.Password), req.body[k.Attr.Password])) {
            throw new GetNativeError(k.Error.UserNamePasswordIncorrect);
        }

        return User.scope('includeDefaultStudyLanguage').findById(credential.get(k.Attr.UserId), {
            attributes: [
                k.Attr.Id,
                k.Attr.BrowserNotificationsEnabled,
                k.Attr.EmailNotificationsEnabled,
                k.Attr.EmailVerified,
                k.Attr.PictureUrl,
                k.Attr.IsSilhouettePicture
            ]
        });
    }).then(user => {
        if (!user) {
            throw new GetNativeError(k.Error.UserMissing);
        }

        return [user, Auth.generateTokenForUserId(user.get(k.Attr.Id))];
    }).spread((user, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const userAsJson = user.get({plain: true});
        userAsJson[k.Attr.Email] = req.body[k.Attr.Email];
        res.status(201).send(userAsJson);
    }).catch(GetNativeError, e => {
        res.status(404);
        next(e);
    }).catch(next);
};
