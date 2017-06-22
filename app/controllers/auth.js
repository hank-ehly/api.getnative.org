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
const _                 = require('lodash');

module.exports.confirmEmail = async (req, res, next) => {
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

        user = await User.find({
            where: {
                id: verificationToken[k.Attr.UserId]
            },
            attributes: [
                k.Attr.Id,
                k.Attr.BrowserNotificationsEnabled,
                k.Attr.Email,
                k.Attr.EmailNotificationsEnabled,
                k.Attr.EmailVerified,
                k.Attr.PictureUrl,
                k.Attr.IsSilhouettePicture
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

    return res.status(200).send(user.get({
        plain: true
    }));
};

module.exports.resendConfirmationEmail = async (req, res, next) => {
    let userAlreadyExists, user, verificationToken, mailHtml;

    try {
        userAlreadyExists = await User.existsForEmail(req.body[k.Attr.Email]);
    } catch (e) {
        return next(e);
    }

    if (!userAlreadyExists) {
        res.status(404);
        return next(new GetNativeError(k.Error.UserMissing));
    }

    try {
        user = await User.find({
            where: {email: req.body[k.Attr.Email]}
        });
    } catch (e) {
        return next(e);
    }

    if (!user) {
        // this overlaps with existsForEmail
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
            confirmationURL: Auth.generateConfirmationURLForToken(verificationToken.get(k.Attr.Token)),
            __: i18n.__
        };

        // this syntax is ugly -- but promisify/Promise.method/Promisify.fromCallback don't work
        mailHtml = await new Promise((resolve, reject) => {
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

    if (!mailHtml) {
        throw new Error('variable mailHtml is undefined');
    }

    try {
        await mailer.sendMail({
            subject: i18n.__('welcome.title'),
            from:    config.get(k.NoReply),
            to:      req.body[k.Attr.Email],
            html:    mailHtml
        });
    } catch (e) {
        return next(e);
    }

    res.sendStatus(204);
};
