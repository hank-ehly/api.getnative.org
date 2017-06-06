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

const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');
const _                 = require('lodash');

// todo: move all this to passport custom
module.exports.create = (req, res, next) => {
    let cache = {};

    return User.existsForEmail(req.body[k.Attr.Email]).then(alreadyExists => {
        if (alreadyExists) {
            return User.find({
                where: {
                    email: req.body[k.Attr.Email]
                }
            }).then(user => {
                cache.user = user;

                return AuthAdapterType.find({
                    where: {
                        name: 'local'
                    }
                });
            }).then(authAdapterType => {
                return Promise.all([
                    authAdapterType, Identity.find({
                        where: {
                            auth_adapter_type_id: authAdapterType.get(k.Attr.Id),
                            user_id: cache.user.get(k.Attr.Id)
                        }
                    })
                ]);
            }).spread((authAdapterType, identity) => {
                if (identity) {
                    throw new GetNativeError(k.Error.UserAlreadyExists);
                }

                return User.find({
                    where: {
                        email: req.body[k.Attr.Email]
                    }
                }).then(user => {

                    return cache.user.update({
                        email_verified: false
                    });
                }).then(() => {
                    return Identity.create({
                        user_id: cache.user.get(k.Attr.Id),
                        auth_adapter_type_id: authAdapterType.get(k.Attr.Id)
                    });
                }).then(identity => {
                    if (!identity) {
                        throw new Error('Failed to create new user');
                    }

                    return Credential.create({
                        user_id: cache.user.get(k.Attr.Id),
                        password: Auth.hashPassword(req.body[k.Attr.Password])
                    });
                });
            });
        } else {
            return Language.find({
                where: {
                    code: 'en'
                }
            }).then(language => {
                return User.create({
                    default_study_language_id: language.get(k.Attr.Id),
                    interface_language_id: language.get(k.Attr.Id),
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
                return AuthAdapterType.find({
                    where: {
                        name: 'local'
                    }
                });
            }).then(authAdapterType => {
                return Identity.create({
                    user_id: cache.user.get(k.Attr.Id),
                    auth_adapter_type_id: authAdapterType.get(k.Attr.Id)
                });
            });
        }
    }).then(() => {
        return User.find({
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
            token: Auth.generateRandomHash(),
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

module.exports.update = async (req, res, next) => {
    let updateCount;

    const changes = _.transform(req.body, (result, value, key) => {
        const acceptableKeys = [
            k.Attr.EmailNotificationsEnabled, k.Attr.BrowserNotificationsEnabled, k.Attr.DefaultStudyLanguageCode, 'interface_language_code'
        ];

        if (acceptableKeys.includes(key)) {
            result[key] = value;
        }
    }, {});

    if (_.size(changes) === 0) {
        return res.sendStatus(304);
    }

    if (changes[k.Attr.DefaultStudyLanguageCode]) {
        changes.default_study_language_id = await Language.findIdForCode(changes[k.Attr.DefaultStudyLanguageCode]);
        delete changes[k.Attr.DefaultStudyLanguageCode];
    }

    if (changes.interface_language_code) {
        changes.interface_language_id = await Language.findIdForCode(changes.interface_language_code);
        delete changes.interface_language_code;
    }

    try {
        [updateCount] = await User.update(changes, {
            where: {
                id: req.user[k.Attr.Id]
            }
        })
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
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
