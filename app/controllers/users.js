/**
 * users
 * get-native.com
 *
 * Created by henryehly on 2017/02/03.
 */

const services          = require('../services');
const GetNativeError    = services['GetNativeError'];
const Utility           = services['Utility'];
const config            = require('../../config/application').config;
const Auth              = services['Auth'];
const k                 = require('../../config/keys.json');
const db                = require('../models');
const User              = db[k.Model.User];
const Credential        = db[k.Model.Credential];
const Identity          = db[k.Model.Identity];
const AuthAdapterType   = db[k.Model.AuthAdapterType];
const Language          = db[k.Model.Language];
const VerificationToken = db[k.Model.VerificationToken];

const Promise           = require('bluebird');
const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');
const _                 = require('lodash');

module.exports.create = (req, res, next) => {
    let cache = {};

    // todo: Use DB unique key constraint to throw error
    return User.existsForEmail(req.body[k.Attr.Email]).then(alreadyExists => {
        if (alreadyExists) {
            throw new GetNativeError(k.Error.UserAlreadyExists);
        }

        return Language.findOne({
            where: {
                code: 'en'
            }
        });
    }).then(language => {
        return User.create({
            default_study_language_id: language.get(k.Attr.Id),
            email: req.body[k.Attr.Email]
        });
    }).then(user => {
        if (!user) {
            throw new Error('Failed to create new user');
        }

        cache.user = user;

        return Credential.create({
            user_id: user.get(k.Attr.Id),
            password: Auth.hashPassword(req.body[k.Attr.Password])
        });
    }).then(credential => {
        return AuthAdapterType.findOne({
            where: {
                name: 'local'
            }
        });
    }).then(authAdapterType => {
        return Identity.create({
            user_id: cache.user.get(k.Attr.Id),
            auth_adapter_type_id: authAdapterType.get(k.Attr.Id)
        });
    }).then(() => {
        return User.scope('includeDefaultStudyLanguage').findOne({
            where: {
                id: cache.user.get(k.Attr.Id)
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
        });
    }).then(user => {
        cache.user = user;

        return VerificationToken.create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateVerificationToken(),
            expiration_date: Utility.tomorrow()
        });
    }).then(verificationToken => {
        return new Promise((resolve, reject) => {
            res.app.render(k.Templates.Welcome, {
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
            from: config.get(k.NoReply),
            to: req.body[k.Attr.Email],
            html: html
        });
    }).then(() => {
        return Auth.generateTokenForUserId(cache.user.get(k.Attr.Id));
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        res.status(201).send(cache.user.get({plain: true}));
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.UserAlreadyExists) {
            res.status(422);
        }
        next(e);
    }).catch(next);
};

module.exports.show = (req, res) => {
    const jsonUser = req.user.get({plain: true});
    const normalizedUserObj = _.omit(jsonUser, [k.Attr.CreatedAt, k.Attr.UpdatedAt, 'default_study_language_id']);
    res.send(normalizedUserObj);
};

module.exports.update = (req, res, next) => {
    const attr = _.transform(req.body, function(result, value, key) {
        if ([k.Attr.EmailNotificationsEnabled, k.Attr.BrowserNotificationsEnabled, k.Attr.DefaultStudyLanguageCode].includes(key)) {
            result[key] = value;
        }
    }, {});

    if (_.size(attr) === 0) {
        res.sendStatus(304);
    }

    let promises = [];
    if (attr[k.Attr.DefaultStudyLanguageCode]) {
        const languagePromise = Language.findOne({
            where: {
                code: attr[k.Attr.DefaultStudyLanguageCode]
            }
        });

        promises.push(languagePromise);
    }

    return Promise.all(promises).spread(language => {
        if (language) {
            delete attr[k.Attr.DefaultStudyLanguageCode];
            attr.default_study_language_id = language.get(k.Attr.Id);
        }

        return req.user.update(attr);
    }).then(() => {
        return res.sendStatus(204);
    }).catch(next);
};

module.exports.updatePassword = (req, res, next) => {
    const hashPassword = Auth.hashPassword(req.body[k.Attr.NewPassword]);

    return Credential.update({
        password: hashPassword
    }, {
        where: {
            user_id: req.user[k.Attr.Id]
        }
    }).then(() => {
        return new Promise((resolve, reject) => {
            res.app.render(k.Templates.PasswordUpdated, {__: i18n.__}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    }).then(html => {
        return mailer.sendMail({
            subject: i18n.__('password-updated.title'),
            from: config.get(k.NoReply),
            to: req.user.get(k.Attr.Email),
            html: html
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
