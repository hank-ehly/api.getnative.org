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
        verificationToken = await VerificationToken.find({where: {token: req.body.token}});
    } catch (e) {
        return next(e);
    }

    if (!verificationToken) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    } else if (verificationToken.isExpired()) {
        res.status(422);
        return next(new GetNativeError(k.Error.EmailConfirmPeriodExpired));
    } else if (verificationToken.is_verification_complete) {
        res.status(422);
        return next(new GetNativeError(k.Error.EmailAlreadyConfirmed));
    }

    const t = await db.sequelize.transaction();
    try {
        await User.update({email_verified: true, email_notifications_enabled: true}, {where: {id: verificationToken[k.Attr.UserId]}, transaction: t});
        await verificationToken.update({is_verification_complete: true}, {transaction: t});
        await t.commit();

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
                __: i18n.__,
                __mf: i18n.__mf,
                contact: config.get(k.EmailAddress.Contact),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
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
            html:    emailTemplateVariables
        }, null);
    } catch (e) {
        await t.rollback();

        if (e instanceof GetNativeError && e.code === k.Error.TokenExpired) {
            res.status(404);
        }

        return next(e);
    }

    return res.status(200).send(user.get({plain: true}));
};

module.exports.sendPasswordResetLink = async (req, res, next) => {
    const email = req.body[k.Attr.Email];

    if (!await db[k.Model.User].existsForEmail(email)) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserDoesNotExist));
    }

    try {
        const user = await db[k.Model.User].find({where: {email: email}});

        const tokenObj = await db[k.Model.VerificationToken].create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        });

        let pathname = 'reset_password';
        if (!config.isDev()) {
            pathname = [i18n.getLocale(), pathname].join('/');
        }

        const passwordResetLink = Auth.generateConfirmationURLForTokenWithPath(tokenObj.get(k.Attr.Token), pathname);

        const template = await new Promise((resolve, reject) => {
            req.app.render(k.Templates.PasswordResetLink, {
                __: i18n.__,
                __mf: i18n.__mf,
                contact: config.get(k.EmailAddress.Contact),
                passwordResetLink: passwordResetLink,
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: i18n.__('passwordResetLink.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      user.get(k.Attr.Email),
            html:    template
        }, null);
    } catch (e) {
        return next(e);
    }

    return res.sendStatus(204);
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
            __: i18n.__,
            __mf: i18n.__mf,
            confirmationURL: confirmationURL,
            contact: config.get(k.EmailAddress.Contact),
            facebookPageURL: config.get(k.SNS.FacebookPageURL),
            twitterPageURL: config.get(k.SNS.TwitterPageURL),
            youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
            websiteURL: config.get(k.Client.BaseURI)
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
            html:    html
        }, null);
    } catch (e) {
        return next(e);
    }

    res.sendStatus(204);
};

module.exports.resetPassword = async (req, res, next) => {
    let verificationToken;

    try {
        verificationToken = await VerificationToken.find({
            rejectOnEmpty: true,
            where: {token: req.body[k.Attr.Token]}
        });
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.VerificationTokenDoesNotExist));
    }

    if (verificationToken.isExpired()) {
        res.status(422);
        return next(new GetNativeError(k.Error.PasswordResetPeriodExpired));
    } else if (verificationToken.is_verification_complete) {
        res.status(422);
        return next(new GetNativeError(k.Error.PasswordResetAlreadyComplete));
    }

    const t = await db.sequelize.transaction();
    try {
        req.user = await db[k.Model.User].findByPrimary(verificationToken.get(k.Attr.UserId));
        const credential = _.first(await db[k.Model.Credential].findOrCreate({where: {user_id: req.user.get(k.Attr.Id)}, transaction: t}));
        await credential.update({password: Auth.hashPassword(req.body[k.Attr.Password])}, {req: req, transaction: t});
        await verificationToken.update({is_verification_complete: true}, {transaction: t});
        await t.commit();
    } catch (e) {
        await t.rollback();
        return next(e);
    }

    return res.sendStatus(204);
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

    const t = await db.sequelize.transaction();
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
        throw new Error('variable token is undefined');
    }

    try {
        html = await new Promise((resolve, reject) => {
            let pathname = 'confirm_email_update';
            if (!config.isDev()) {
                pathname = [req.getLocale(), 'confirm_email_update'].join('/');
            }
            const confirmationURL = Auth.generateConfirmationURLForTokenWithPath(token.get(k.Attr.Token), pathname);
            const locals = {
                __: i18n.__,
                __mf: i18n.__mf,
                confirmationURL: confirmationURL,
                contact: config.get(k.EmailAddress.Contact),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            };
            res.app.render(k.Templates.ConfirmEmailUpdate, locals, (err, html) => {
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
        throw new Error('variable html is undefined');
    }

    try {
        await mailer.sendMail({
            subject: i18n.__('confirmEmailUpdate.subject'),
            from:    config.get(k.EmailAddress.NoReply),
            to:      req.body[k.Attr.Email],
            html:    html
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

    if (!vt) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    } else if (vt.isExpired()) {
        res.status(422);
        return next(new GetNativeError(k.Error.EmailUpdatePeriodExpired));
    }  else if (vt.is_verification_complete) {
        res.status(422);
        return next(new GetNativeError(k.Error.EmailAlreadyUpdated));
    }

    try {
        emailChangeRequest = await db[k.Model.EmailChangeRequest].find({where: {verification_token_id: vt.get(k.Attr.Id)}});
    } catch (e) {
       return next(e);
    }

    if (!emailChangeRequest) {
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const t = await db.sequelize.transaction();
    try {
        userBeforeUpdate = await db[k.Model.User].findByPrimary(vt.get(k.Attr.UserId));

        await db[k.Model.User].update({email: emailChangeRequest.get(k.Attr.Email)}, {where: {id: vt.get(k.Attr.UserId)}, transaction: t});
        await vt.update({is_verification_complete: true}, {transaction: t});
        await t.commit();

        user = await User.findByPrimary(vt.get(k.Attr.UserId), {
            attributes: [
                k.Attr.Id, k.Attr.BrowserNotificationsEnabled, k.Attr.Email, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
                k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
            ]
        });

        jwt = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
    } catch (e) {
        await t.rollback();
        return next(e);
    }

    if (!jwt) {
        throw new Error('variable jwt is undefined');
    }

    Auth.setAuthHeadersOnResponseWithToken(res, jwt);

    try {
        const priorAddressNotificationHtml = await new Promise((resolve, reject) => {
            const locals = {
                __: i18n.__,
                __mf: i18n.__mf,
                contact: config.get(k.EmailAddress.Contact),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI),
                updatedEmail: user.get(k.Attr.Email)
            };
            res.app.render(k.Templates.NotifyEmailUpdate, locals, (err, html) => {
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
            html:    priorAddressNotificationHtml
        }, null);

        const newAddressSuccessNotificationHtml = await new Promise((resolve, reject) => {
            const locals = {
                __: i18n.__,
                __mf: i18n.__mf,
                contact: config.get(k.EmailAddress.Contact),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            };
            res.app.render(k.Templates.EmailUpdateSuccess, locals, (err, html) => {
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
            html:    newAddressSuccessNotificationHtml
        }, null);
    } catch (e) {
        return next(e);
    }

    return res.status(200).send(user.get({plain: true}));
};
