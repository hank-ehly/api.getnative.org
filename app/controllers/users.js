/**
 * users
 * get-native.com
 *
 * Created by henryehly on 2017/02/03.
 */

const GetNativeError = require('../services').GetNativeError;
const Utility        = require('../services').Utility;
const User        = require('../models').User;
const config         = require('../../config');
const Auth           = require('../services').Auth;
const k              = require('../../config/keys.json');

const Promise        = require('bluebird');
const mailer         = require('../../config/initializers/mailer');
const i18n           = require('i18n');
const _              = require('lodash');

module.exports.index = (req, res, next) => {
    User.findById(req.userId, {
        attributes: {exclude: [k.Attr.Password, k.Attr.CreatedAt, k.Attr.UpdatedAt]}
    }).then(user => {
        res.send(user.get({plain: true}));
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
