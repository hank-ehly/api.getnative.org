/**
 * auth
 * api.getnativelearning.com
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

const mailer            = require('../../config/initializers/mailer');
const i18n              = require('i18n');
const path              = require('path');
const _                 = require('lodash');

module.exports.confirmRegistrationEmail = async (req, res, next) => {
    let verificationToken, user, jsonWebToken;

    try {
        verificationToken = await VerificationToken.find({
            where: {
                token: req.body.token
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!verificationToken || verificationToken.isExpired()) {
        res.status(404);
        return next(new GetNativeError(k.Error.TokenExpired));
    }

    try {
        await User.update({
            email_verified: true,
            email_notifications_enabled: true
        }, {
            where: {
                id: verificationToken[k.Attr.UserId]
            }
        });

        user = await User.findByPrimary(verificationToken[k.Attr.UserId], {
            attributes: [
                k.Attr.Id, k.Attr.BrowserNotificationsEnabled, k.Attr.Email, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
                k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
            ]
        });

        jsonWebToken = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
        Auth.setAuthHeadersOnResponseWithToken(res, jsonWebToken);

        const emailTemplateVariables = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.RegistrationEmailConfirmed, {
                contact: config.get(k.EmailAddress.Contact),
                __: i18n.__,
                __mf: i18n.__mf,
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('registrationEmailConfirmed.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      user.get(k.Attr.Email),
            html:    emailTemplateVariables,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);
    } catch (e) {
        if (e instanceof GetNativeError && e.code === k.Error.TokenExpired) {
            res.status(404);
        }

        return next(e);
    }

    return res.status(200).send(user.get({plain: true}));
};

module.exports.resendRegistrationConfirmationEmail = async (req, res, next) => {
    let user, verificationToken, html;

    try {
        user = await User.find({where: {email: req.body[k.Attr.Email]}});
    } catch (e) {
        return next(e);
    }

    if (!user) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserMissing));
    }

    if (user.get(k.Attr.EmailVerified)) {
        res.status(422);
        return next(new GetNativeError(k.Error.UserAlreadyVerified));
    }

    try {
        verificationToken = await VerificationToken.create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        });
    } catch (e) {
        return next(e);
    }

    if (!verificationToken) {
        throw new Error('variable verificationToken is undefined');
    }

    try {
        let pathname = 'confirm_email';
        if (!config.isDev()) {
            pathname = [req.getLocale(), 'confirm_email'].join('/');
        }
        const confirmationURL = Auth.generateConfirmationURLForTokenWithPath(verificationToken.get(k.Attr.Token), pathname);
        const templateVariables = {
            confirmationURL: confirmationURL,
            contact: config.get(k.EmailAddress.Contact),
            __: i18n.__,
            __mf: i18n.__mf
        };

        html = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.Welcome, templateVariables, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    } catch (e) {
        return next(e);
    }

    if (!html) {
        throw new Error('variable mailHtml is undefined');
    }

    try {
        await mailer.sendMail({
            subject: i18n.__('welcome.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      req.body[k.Attr.Email],
            html:    html,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);
    } catch (e) {
        return next(e);
    }

    res.sendStatus(204);
};

module.exports.sendEmailUpdateConfirmationEmail = async (req, res, next) => {
    let user, token, html;

    try {
        if (await db[k.Model.User].existsForEmail(req.body[k.Attr.Email])) {
            res.status(422);
            return next(new GetNativeError(k.Error.UserAlreadyExists));
        }
    } catch (e) {
        return next(e);
    }

    try {
        user = await User.findByPrimary(req.params[k.Attr.Id]);
    } catch (e) {
        return next(e);
    }

    if (!user) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserMissing));
    }

    let t = await db.sequelize.transaction();
    try {
        token = await VerificationToken.create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        }, {transaction: t});

        await db[k.Model.EmailChangeRequest].create({
            verification_token_id: token.get(k.Attr.Id),
            email: req.body[k.Attr.Email]
        }, {transaction: t});

        await t.commit();
    } catch (e) {
        await t.rollback();
        return next(e);
    }

    if (!token) {
        throw new Error('variable verificationToken is undefined');
    }

    try {
        html = await new Promise((resolve, reject) => {
            let pathname = 'confirm_email_update';
            if (!config.isDev()) {
                pathname = [req.getLocale(), 'confirm_email_update'].join('/');
            }
            const confirmationURL = Auth.generateConfirmationURLForTokenWithPath(token.get(k.Attr.Token), pathname);
            res.app.render(k.Templates.ConfirmEmailUpdate, {
                confirmationURL: confirmationURL,
                contact: config.get(k.EmailAddress.Contact),
                __: i18n.__,
                __mf: i18n.__mf
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });
    } catch (e) {
        return next(e);
    }

    if (!html) {
        throw new Error('variable mailHtml is undefined');
    }

    try {
        await mailer.sendMail({
            subject: i18n.__('confirmEmailUpdate.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      req.body[k.Attr.Email],
            html:    html,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);
    } catch (e) {
        return next(e);
    }

    res.sendStatus(204);
};

module.exports.confirmEmailUpdate = async (req, res, next) => {
    let vt, emailChangeRequest, userBeforeUpdate, user, jwt, html;

    try {
        vt = await VerificationToken.find({where: {token: req.body.token}});
    } catch (e) {
        return next(e);
    }

    if (!vt || vt.isExpired()) {
        res.status(404);
        return next(new GetNativeError(k.Error.TokenExpired));
    }

    try {
        emailChangeRequest = await db[k.Model.EmailChangeRequest].find({where: {verification_token_id: vt.get(k.Attr.Id)}});
    } catch (e) {
       return next(e);
    }

    if (!emailChangeRequest) {
        return next(e);
    }

    try {
        userBeforeUpdate = await db[k.Model.User].findByPrimary(vt.get(k.Attr.UserId));

        await db[k.Model.User].update({email: emailChangeRequest.get(k.Attr.Email)}, {where: {id: vt.get(k.Attr.UserId)}});

        user = await User.findByPrimary(vt.get(k.Attr.UserId), {
            attributes: [
                k.Attr.Id, k.Attr.BrowserNotificationsEnabled, k.Attr.Email, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
                k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
            ]
        });

        jwt = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
    } catch (e) {
        return next(e);
    }

    if (!jwt) {
        throw new Error('variable jwt is undefined');
    }

    Auth.setAuthHeadersOnResponseWithToken(res, jwt);

    try {
        const priorAddressNotificationHtml = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.NotifyEmailUpdate, {
                updatedEmail: user.get(k.Attr.Email),
                contact: config.get(k.EmailAddress.Contact),
                __: i18n.__,
                __mf: i18n.__mf
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('notifyEmailUpdate.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      userBeforeUpdate[k.Attr.Email],
            html:    priorAddressNotificationHtml,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);

        const newAddressSuccessNotificationHtml = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.EmailUpdateSuccess, {
                contact: config.get(k.EmailAddress.Contact),
                __: i18n.__,
                __mf: i18n.__mf
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('emailUpdateSuccess.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      user.get(k.Attr.Email),
            html:    newAddressSuccessNotificationHtml,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);
    } catch (e) {
        return next(e);
    }

    return res.status(200).send(user.get({plain: true}));
};
