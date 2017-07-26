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
const path              = require('path');
const _                 = require('lodash');

// todo: move all this to passport custom
module.exports.create = async (req, res, next) => {
    let user, vt, localAuthAdapterTypeId = await AuthAdapterType.findIdForProvider('local');

    try {
        user = await db[k.Model.User].find({
            where: {email: req.body[k.Attr.Email]},
            include: [{
                model: db[k.Model.Identity],
                as: 'identities',
                required: true,
                where: {auth_adapter_type_id: localAuthAdapterTypeId},
            }]
        });
    } catch (e) {
        return next(e);
    }

    if (user) {
        res.status(422);
        return next(new GetNativeError(k.Error.UserAlreadyExists));
    }

    const t = await db.sequelize.transaction();

    try {
        const l = await db[k.Model.Language].findIdForCode(req.locale);

        [user] = await User.findOrCreate({
            where: {email: req.body[k.Attr.Email]},
            defaults: {default_study_language_id: 'en', interface_language_id: l},
            transaction: t
        });

        await Identity.findOrCreate({
            where: {user_id: user.get(k.Attr.Id), auth_adapter_type_id: localAuthAdapterTypeId},
            transaction: t
        });

        await Credential.findOrCreate({
            where: {user_id: user.get(k.Attr.Id), password: Auth.hashPassword(req.body[k.Attr.Password])},
            transaction: t
        });

        vt = await VerificationToken.create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        }, {transaction: t});

        await t.commit();
    } catch (e) {
        await t.rollback();
        return next(new GetNativeError(k.Error.CreateResourceFailure));
    }

    const html = await new Promise((resolve, reject) => {
        res.app.render(k.Templates.Welcome, {
            confirmationURL: Auth.generateConfirmationURLForTokenWithPath(vt.get(k.Attr.Token), 'confirm_email'),
            contact: config.get(k.EmailAddress.Contact),
            __: req.__,
            contactEmail: config.get(k.EmailAddress.Contact)
        }, (err, html) => {
            if (err) {
                reject(err);
            } else {
                resolve(html);
            }
        });
    });

    await mailer.sendMail({
        subject: req.__('welcome.title'),
        from: config.get(k.NoReply),
        to: req.body[k.Attr.Email],
        html: html,
        attachments: [
            {
                path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                cid: 'logo'
            }
        ]
    }, null);

    await user.reload({
        plain: true,
        attributes: [
            k.Attr.Id, k.Attr.Email, k.Attr.BrowserNotificationsEnabled, k.Attr.EmailNotificationsEnabled, k.Attr.EmailVerified,
            k.Attr.PictureUrl, k.Attr.IsSilhouettePicture
        ]
    });

    const token = await Auth.generateTokenForUserId(user[k.Attr.Id]);
    Auth.setAuthHeadersOnResponseWithToken(res, token);
    res.status(201).send(user);
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

module.exports.updatePassword = async (req, res, next) => {
    const hashPassword = Auth.hashPassword(req.body[k.Attr.NewPassword]);

    try {
        await Credential.update({password: hashPassword}, {where: {user_id: req.user[k.Attr.Id]}});

        const html = await new Promise((resolve, reject) => {
            res.app.render(k.Templates.PasswordUpdated, {
                contact: config.get(k.EmailAddress.Contact),
                __: req.__
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: req.__('password-updated.title'),
            from: config.get(k.NoReply),
            to: req.user.get(k.Attr.Email),
            html: html,
            attachments: [
                {
                    path: path.resolve(__dirname, '..', 'assets', 'logo.png'),
                    cid: 'logo'
                }
            ]
        }, null);
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.delete = async (req, res, next) => {
    const t = await db.sequelize.transaction();

    try {
        const options = {
            where: {
                user_id: req.user.get(k.Attr.Id)
            },
            transaction: t
        };

        await db[k.Model.Credential].destroy(options);
        await db[k.Model.CuedVideo].destroy(options);
        await db[k.Model.Identity].destroy(options);
        await db[k.Model.UserRole].destroy(options);
        await db[k.Model.Like].destroy(options);

        const emailChangeRequestIds = [], writingAnswerIds = [];

        let verificationTokens = await db[k.Model.VerificationToken].findAll({
            attributes: [k.Attr.Id],
            where: {user_id: req.user.get(k.Attr.Id)},
            include: [
                {
                    model: db[k.Model.EmailChangeRequest],
                    required: true,
                    attributes: [k.Attr.Id],
                    as: 'email_change_requests'
                }
            ]
        });

        verificationTokens = _.invokeMap(verificationTokens, 'get', {plain: true});

        for (let i = 0; i < verificationTokens.length; i++) {
            for (let j = 0; j < verificationTokens[i].email_change_requests.length; j++) {
                emailChangeRequestIds.push(verificationTokens[i].email_change_requests[j][k.Attr.Id]);
            }
        }

        let studySessions = await db[k.Model.StudySession].findAll({
            attributes: [k.Attr.Id],
            where: {user_id: req.user.get(k.Attr.Id)},
            include: [
                {
                    model: db[k.Model.WritingAnswer],
                    attributes: [k.Attr.Id],
                    as: 'writing_answers',
                    required: true
                }
            ]
        });

        studySessions = _.invokeMap(studySessions, 'get', {plain: true});

        for (let i = 0; i < studySessions.length; i++) {
            for (let j = 0; j < studySessions[i].writing_answers.length; j++) {
                writingAnswerIds.push(studySessions[i].writing_answers[j][k.Attr.Id]);
            }
        }

        await db[k.Model.EmailChangeRequest].destroy({
            where: {
                id: {
                    $in: emailChangeRequestIds
                }
            },
            transaction: t
        });

        await db[k.Model.VerificationToken].destroy(options);

        await db[k.Model.WritingAnswer].destroy({
            where: {
                id: {
                    $in: writingAnswerIds
                }
            },
            transaction: t
        });

        await db[k.Model.StudySession].destroy(options);

        await req.user.destroy({transaction: t});
        await t.commit();
    } catch (e) {
        await t.rollback();
        return next(e);
    }

    if (!req.body['reason']) {
        return res.sendStatus(204);
    }

    try {
        const html = await new Promise((resolve, reject) => {
            const variables = {
                __: req.__,
                email: req.user.get(k.Attr.Email),
                contact: config.get(k.EmailAddress.Contact),
                reason: req.body['reason']
            };

            res.app.render(k.Templates.DeleteAccountReason, variables, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: req.__('delete-account-reason.title'),
            from: config.get(k.NoReply),
            to: config.get(k.EmailAddress.Contact),
            html: html,
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

    return res.sendStatus(204);
};
