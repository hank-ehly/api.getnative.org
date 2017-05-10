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
const User = require('../models')[k.Model.User];

module.exports.create = (req, res, next) => {
    const attributes = [
        k.Attr.Id,
        k.Attr.Email,
        k.Attr.BrowserNotificationsEnabled,
        k.Attr.EmailNotificationsEnabled,
        k.Attr.EmailVerified,
        k.Attr.DefaultStudyLanguageCode,
        k.Attr.PictureUrl,
        k.Attr.IsSilhouettePicture,
        k.Attr.Password
    ];

    User.find({
        where: {email: req.body[k.Attr.Email]},
        attributes: attributes
    }).then(user => {
        if (!user || !Auth.verifyPassword(user.password, req.body[k.Attr.Password])) {
            throw new GetNativeError(k.Error.UserNamePasswordIncorrect);
        }

        return [user, Auth.generateTokenForUserId(user.id)];
    }).spread((user, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const userAsJson = user.get({plain: true});
        delete userAsJson.password;
        res.send(userAsJson);
    }).catch(GetNativeError, e => {
        res.status(404);
        next(e);
    }).catch(next);
};
