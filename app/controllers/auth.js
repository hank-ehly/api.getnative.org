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
const Account           = db.Account;
const VerificationToken = db.VerificationToken;
const k                 = require('../../config/keys.json');

const Promise           = require('bluebird');
const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');

module.exports.login = (req, res, next) => {
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

    Account.find({where: {email: req.body[k.Attr.Email]}, attributes: attributes}).then(account => {
        if (!account || !Auth.verifyPassword(account.password, req.body[k.Attr.Password])) {
            throw new GetNativeError(k.Error.UserNamePasswordIncorrect);
        }

        return [account, Auth.generateTokenForAccountId(account.id)];
    }).spread((account, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const accountAsJson = account.get({plain: true});
        delete accountAsJson.password;
        res.send(accountAsJson);
    }).catch(GetNativeError, e => {
        res.status(404);
        next(e);
    }).catch(next);
};

module.exports.register = (req, res, next) => {
    let account = null;

    // todo: Use DB unique key constraint to throw error
    return Account.existsForEmail(req.body[k.Attr.Email]).then(exists => {
        if (exists) {
            throw new GetNativeError(k.Error.AccountAlreadyExists);
        }
        return Account.create({
            email: req.body[k.Attr.Email],
            password: Auth.hashPassword(req.body[k.Attr.Password])
        });
    }).then(_account => {
        account = _account;
        if (!account) {
            throw new Error('Failed to create new account');
        }
        return VerificationToken.create({
            account_id: account.id,
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
        return Auth.generateTokenForAccountId(account.id);
    }).then(token => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        const accountAsJson = account.get({plain: true});
        delete accountAsJson.password;
        res.send(accountAsJson);
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.AccountAlreadyExists) {
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

        return [token, Account.update(changes, {where: {id: token.account_id}})];
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

        return Account.findOne({attributes: attributes, where: {id: token.account_id}});
    }).then(account => {
        return [account, Auth.generateTokenForAccountId(account.id)];
    }).spread((account, token) => {
        Auth.setAuthHeadersOnResponseWithToken(res, token);
        res.status(200).send(account.get({plain: true}));
    }).catch(GetNativeError, e => {
        if (e.code === k.Error.TokenExpired) {
            res.status(404);
        }
        next(e);
    }).catch(next);
};

module.exports.resendConfirmationEmail = (req, res, next) => {
    Account.existsForEmail(req.body[k.Attr.Email]).then(exists => {
        if (!exists) {
            throw new GetNativeError(k.Error.AccountMissing);
        }

        return Account.findOne({where: {email: req.body[k.Attr.Email]}});
    }).then(function(account) {
        if (account.get(k.Attr.EmailVerified)) {
            throw new GetNativeError(k.Error.AccountAlreadyVerified);
        }

        const token = Auth.generateVerificationToken();
        const expirationDate = Utility.tomorrow();

        return VerificationToken.create({
            account_id: account.get(k.Attr.Id),
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
        if (e.code === k.Error.AccountMissing) {
            res.status(404);
        } else if (e.code === k.Error.AccountAlreadyVerified) {
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
