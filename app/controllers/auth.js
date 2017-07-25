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

    const changes = {
        email_verified: true,
        email_notifications_enabled: true
    };

    try {
        await User.update(changes, {
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
    } catch (e) {
        return next(e);
    }

    if (!user) {
        throw new Error('variable user is undefined');
    }

    try {
        jsonWebToken = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
    } catch (e) {
        if (e instanceof GetNativeError && e.code === k.Error.TokenExpired) {
            res.status(404);
        }

        return next(e);
    }

    if (!jsonWebToken) {
        throw new Error('variable jsonWebToken is undefined');
    }

    Auth.setAuthHeadersOnResponseWithToken(res, jsonWebToken);

    return res.status(200).send(user.get({plain: true}));
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
                __: i18n.__
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('notify-email-update.title'),
            from:    config.get(k.NoReply),
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
                __: i18n.__
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('notify-email-update-success.title'),
            from:    config.get(k.NoReply),
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
        const templateVariables = {
            confirmationURL: Auth.generateConfirmationURLForTokenWithPath(token.get(k.Attr.Token), 'confirm_email_update'),
            contact: config.get(k.EmailAddress.Contact),
            __: i18n.__
        };

        html = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.ConfirmEmailUpdate, templateVariables, (err, html) => {
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
            subject: i18n.__('confirm-email-update.title'),
            from:    config.get(k.NoReply),
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
        const templateVariables = {
            confirmationURL: Auth.generateConfirmationURLForTokenWithPath(verificationToken.get(k.Attr.Token), 'confirm_email'),
            contact: config.get(k.EmailAddress.Contact),
            __: i18n.__
        };

        html = await new Promise((resolve, reject) => {
            res.app.render('welcome', templateVariables, (err, html) => {
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
            subject: i18n.__('welcome.title'),
            from:    config.get(k.NoReply),
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
