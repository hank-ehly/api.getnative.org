/**
 * facebook
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('../application').config;
const logger = require('../logger');
const k = require('../keys.json');
const db = require('../../app/models');
const Identity = db[k.Model.Identity];
const AuthAdapterType = db[k.Model.AuthAdapterType];
const User = db[k.Model.User];
const Language = db[k.Model.Language];
const services = require('../../app/services');
const Auth = services['Auth'];
const Utility = services['Utility'];

const strategy = new FacebookStrategy({
    clientID: config.get(k.OAuth.Facebook.ClientID),
    clientSecret: config.get(k.OAuth.Facebook.ClientSecret),
    profileFields: ['emails', 'gender', 'displayName', 'name', 'profileUrl'],
    callbackURL: config.get(k.OAuth.Facebook.CallbackURL)
}, (accessToken, refreshToken, profile, cb) => {
    let adapter = null;

    return AuthAdapterType.findOne({
        where: {
            name: 'facebook'
        },
        attributes: [
            k.Attr.Id
        ]
    }).then(_adapter => {
        if (!_adapter) {
            throw new Error('Adapter not found.');
        }

        adapter = _adapter;

        return Identity.findOne({
            where: {
                auth_adapter_type_id: adapter.get(k.Attr.Id),
                auth_adapter_user_id: profile[k.Attr.Id]
            },
            attributes: [
                k.Attr.UserId
            ]
        });
    }).then(identity => {
        if (identity) {
            return User.findById(identity.get(k.Attr.UserId), {
                include: [
                    {
                        model: Language,
                        attributes: [k.Attr.Name, k.Attr.Code],
                        as: 'default_study_language'
                    }
                ]
            }).then(user => {
                return cb(null, user);
            });
        } else {
            return Language.findOne({
                where: {
                    code: 'en'
                },
                attributes: [k.Attr.Id]
            }).then(language => {
                return User.create({
                    default_study_language_id: language.get(k.Attr.Id)
                }).then(user => {
                    return Identity.create({
                        user_id: user.get(k.Attr.Id),
                        auth_adapter_type_id: adapter.get(k.Attr.Id),
                        auth_adapter_user_id: profile[k.Attr.Id]
                    }).then(() => {
                        return User.findById(user.get(k.Attr.Id), {
                            include: [
                                {
                                    model: Language,
                                    attributes: [k.Attr.Name, k.Attr.Code],
                                    as: 'default_study_language'
                                }
                            ]
                        }).then(user => {
                            return cb(null, user);
                        });
                    });
                });
            });
        }
    });
});

module.exports = strategy;
