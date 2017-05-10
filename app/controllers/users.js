const db = require('../models');
const require2 = db;
const services = require('../services');
/**
 * users
 * get-native.com
 *
 * Created by henryehly on 2017/02/03.
 */

const GetNativeError = services['GetNativeError'];
const Utility = services['Utility'];
const config = require('../../config');
const Auth = services['Auth'];
const k = require('../../config/keys.json');
const User = db[k.Model.User];
const VerificationToken = db[k.Model.VerificationToken];

const Promise = require('bluebird');
const mailer = require('../../config/initializers/mailer');
const i18n = require('i18n');
const _ = require('lodash');

module.exports.create = (req, res, next) => {
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

module.exports.update = (req, res, next) => {
    const attr = _.transform(req.body, function(result, value, key) {
        if ([k.Attr.EmailNotificationsEnabled, k.Attr.BrowserNotificationsEnabled, k.Attr.DefaultStudyLanguageCode].includes(key)) {
            result[key] = value;
        }
    }, {});

    if (_.size(attr) === 0) {
        return res.sendStatus(304);
    }

    return User.update(attr, {where: {id: req.userId}}).then(() => {
        res.sendStatus(204);
    }).catch(next);
};

module.exports.updatePassword = (req, res, next) => {
    User.findById(req.userId).then(user => {
        if (!Auth.verifyPassword(user.password, req.body[k.Attr.CurrentPassword])) {
            throw new GetNativeError(k.Error.PasswordIncorrect);
        }

        const hashPassword = Auth.hashPassword(req.body[k.Attr.NewPassword]);
        return [user, User.update({password: hashPassword}, {where: {id: req.userId}})];
    }).spread((user) => {
        return [user, new Promise((resolve, reject) => {
            res.app.render(k.Templates.PasswordUpdated, {__: i18n.__}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        })];
    }).spread((user, html) => {
        return mailer.sendMail({
            subject: i18n.__('password-updated.title'),
            from:    config.get(k.NoReply),
            to:      user.get(k.Attr.Email),
            html:    html
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(GetNativeError, e => {
        res.status(404);
        next(e);
    }).catch(next);
};

module.exports.updateEmail = (req, res) => {
    res.sendStatus(204);
};
