/**
 * auth
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const services          = require('../services');
const GetNativeError    = services.GetNativeError;
const Utility           = services.Utility;
const Auth              = services.Auth;
const config            = require('../../config');
const db                = require('../models');
const User           = db.User;
const VerificationToken = db.VerificationToken;
const k                 = require('../../config/keys.json');

const Promise           = require('bluebird');
const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');

module.exports.register = (req, res, next) => {
    let user = null;

    // todo: Use DB unique key constraint to throw error
    return User.existsForEmail(req.body[k.Attr.Email]).then(exists => {
        if (exists) {
            throw new GetNativeError(k.Error.UserAlreadyExists);
        }
        return User.create({
            email: req.body[k.Attr.Email],
            password: Auth.hashPassword(req.body[k.Attr.Password])
        });
    }).then(_user => {
        user = _user;
        if (!user) {
            throw new Error('Failed to create new user');
        }
        return VerificationToken.create({
            user_id: user.id,
            token: Auth.generateVerificationToken(),
            expiration_date: Utility.tomorrow()
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
        return Auth.generateTokenForUserId(user.id);
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const userAsJson = user.get({plain: true});
        delete userAsJson.password;
        res.send(userAsJson);
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.UserAlreadyExists) {
            res.status(422);
        }
        next(e);
    }).catch(next);
};

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
        const attributes = [
            k.Attr.Id,
            k.Attr.Email,
            k.Attr.BrowserNotificationsEnabled,
            k.Attr.EmailNotificationsEnabled,
            k.Attr.EmailVerified,
            k.Attr.DefaultStudyLanguageCode,
            k.Attr.PictureUrl,
            k.Attr.IsSilhouettePicture
        ];

        return User.findOne({attributes: attributes, where: {id: token.user_id}});
    }).then(user => {
        return [user, Auth.generateTokenForUserId(user.id)];
    }).spread((user, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        res.status(200).send(user.get({plain: true}));
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

        return User.findOne({where: {email: req.body[k.Attr.Email]}});
    }).then(function(user) {
        if (user.get(k.Attr.EmailVerified)) {
            throw new GetNativeError(k.Error.UserAlreadyVerified);
        }

        const token = Auth.generateVerificationToken();
        const expirationDate = Utility.tomorrow();

        return VerificationToken.create({
            user_id: user.get(k.Attr.Id),
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

module.exports.authenticate = (req, res, next) => {
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
