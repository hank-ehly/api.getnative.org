/**
 * users
 * get-native.com
 *
 * Created by henryehly on 2017/02/03.
 */

const services = require('../services');
const GetNativeError = services['GetNativeError'];
const Utility = services['Utility'];
const config = require('../../config/application').config;
const Auth = services['Auth'];
const k = require('../../config/keys.json');
const db = require('../models');
const User = db[k.Model.User];
const Credential = db[k.Model.Credential];
const Language = db[k.Model.Language];
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

        return Language.findOne({where: {code: 'en'}});
    }).then(language => {
        return User.create({default_study_language_id: language.get(k.Attr.Id)});
    }).then(_user => {
        if (!_user) {
            throw new Error('Failed to create new user');
        }

        const findUser = User.scope('includeDefaultStudyLanguage').findOne({
            where: {id: _user.get(k.Attr.Id)},
            attributes: [
                k.Attr.Id,
                k.Attr.BrowserNotificationsEnabled,
                k.Attr.EmailNotificationsEnabled,
                k.Attr.EmailVerified,
                k.Attr.PictureUrl,
                k.Attr.IsSilhouettePicture
            ]
        });

        const createCredential = db[k.Model.Credential].create({
            user_id: _user.get(k.Attr.Id),
            email: req.body[k.Attr.Email],
            password: Auth.hashPassword(req.body[k.Attr.Password])
        });

        return Promise.all([findUser, createCredential]);
    }).spread((_user, credential) => {
        user = _user.get({plain: true});
        user[k.Attr.Email] = credential.get(k.Attr.Email);

        return VerificationToken.create({
            user_id: user[k.Attr.Id],
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
        return Auth.generateTokenForUserId(user[k.Attr.Id]);
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const userWithoutPassword = _.omit(user, k.Attr.Password);
        res.status(201).send(userWithoutPassword);
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

        req.user.update(attr).then(() => res.sendStatus(204)).catch(next);
    });
};

module.exports.updatePassword = (req, res, next) => {
    const hashPassword = Auth.hashPassword(req.body[k.Attr.NewPassword]);
    return Credential.update({password: hashPassword}, {where: {user_id: req.user[k.Attr.Id]}}).then(() => {
        return new Promise((resolve, reject) => {
            res.app.render(k.Templates.PasswordUpdated, {__: i18n.__}, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    }).spread(html => {
        return Promise.all([
            html,
            Credential.findOne({
                where: {user_id: req.user[k.Attr.Id]},
                attributes: [k.Attr.Email]
            })
        ]);
    }).spread((html, credential) => {
        return mailer.sendMail({
            subject: i18n.__('password-updated.title'),
            from: config.get(k.NoReply),
            to: credential.get(k.Attr.Email),
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
