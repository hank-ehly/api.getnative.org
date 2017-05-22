/**
 * auth
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const services          = require('../services');
const GetNativeError    = services['GetNativeError'];
const Utility           = services['Utility'];
const Auth              = services['Auth'];
const config            = require('../../config/application').config;
const k                 = require('../../config/keys.json');
const db                = require('../models');
const VerificationToken = db[k.Model.VerificationToken];
const User              = db[k.Model.User];
const Credential        = db[k.Model.Credential];
const Language          = db[k.Model.Language];

const Promise           = require('bluebird');
const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');
const _                 = require('lodash');

module.exports.confirmEmail = (req, res, next) => {
    return VerificationToken.findOne({where: {token: req.body.token}}).then(token => {
        if (!token) {
            throw new GetNativeError(k.Error.TokenExpired);
        }

        if (token.isExpired()) {
            throw new GetNativeError(k.Error.TokenExpired);
        }

        const changes = {};
        changes[k.Attr.EmailVerified] = true;
        changes[k.Attr.EmailNotificationsEnabled] = true;

        return [token, User.update(changes, {where: {id: token.user_id}})];
    }).spread(token => {
        return Credential.findOne({
            where: {user_id: token[k.Attr.UserId]},
            attributes: [k.Attr.Email],
            include: [
                {
                    model: User.scope('includeDefaultStudyLanguage'),
                    attributes: [
                        k.Attr.Id,
                        k.Attr.BrowserNotificationsEnabled,
                        k.Attr.EmailNotificationsEnabled,
                        k.Attr.EmailVerified,
                        k.Attr.PictureUrl,
                        k.Attr.IsSilhouettePicture
                    ]
                }
            ]
        });
    }).then(credential => {
        const json = credential.get({plain: true});
        const user = json['User'];
        _.set(user, k.Attr.Email, json[k.Attr.Email]);
        return [user, Auth.generateTokenForUserId(user[k.Attr.Id])];
    }).spread((user, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        res.status(200).send(user);
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.TokenExpired) {
            res.status(404);
        }
        next(e);
    }).catch(next);
};

module.exports.resendConfirmationEmail = (req, res, next) => {
    User.existsForEmail(req.body[k.Attr.Email]).then(exists => {
        if (!exists) {
            throw new GetNativeError(k.Error.UserMissing);
        }

        return Credential.findOne({
            where: {email: req.body[k.Attr.Email]},
            include: [User]
        });
    }).then(function(credential) {
        credential = credential.get({plain: true});
        const user = credential['User'];
        user[k.Attr.Email] = credential[k.Attr.Email];

        if (user[k.Attr.EmailVerified]) {
            throw new GetNativeError(k.Error.UserAlreadyVerified);
        }

        const token = Auth.generateVerificationToken();
        const expirationDate = Utility.tomorrow();

        return VerificationToken.create({
            user_id: user[k.Attr.Id],
            token: token,
            expiration_date: expirationDate
        });
    }).then(verificationToken => {
        return new Promise((resolve, reject) => {
            res.app.render('welcome', {
                confirmationURL: Auth.generateConfirmationURLForToken(verificationToken.get(k.Attr.Token)),
                __: i18n.__
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    }).then(html => {
        return mailer.sendMail({
            subject: i18n.__('welcome.title'),
            from:    config.get(k.NoReply),
            to:      req.body[k.Attr.Email],
            html:    html
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.UserMissing) {
            res.status(404);
        } else if (e.code === k.Error.UserAlreadyVerified) {
            res.status(422);
        }
        next(e);
    }).catch(next);
};
