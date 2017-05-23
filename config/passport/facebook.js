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

// todo: Refactor
// todo: Test
// todo: (*) Make sure time-out isn't an issue
const strategy = new FacebookStrategy({
    clientID: config.get(k.OAuth.Facebook.ClientID),
    clientSecret: config.get(k.OAuth.Facebook.ClientSecret),
    profileFields: [
        'id',
        'displayName',
        'age_range',
        'locale',
        'photos',
        'emails'
    ],
    callbackURL: config.get(k.OAuth.Facebook.CallbackURL)
}, (accessToken, refreshToken, profile, cb) => {
    logger.info(profile, {json: true});

    // todo: Prevent overlapping accounts (by using email)
    // check if another user exists with the same email
    // IF: exists
    // THEN:
    //     IF: that user has a 'facebook' identity
    //     THEN: get the user data and invoke the callback
    //     ELSE: create a 'facebook' identity for the user and invoke the callback with the user data
    // IF: not exists
    // THEN: create a user record and identity record of 'facebook' type && invoke callback with user data

    // let email = _.first(profile.emails);

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
            return User.scope('includeDefaultStudyLanguage').findById(identity.get(k.Attr.UserId)).then(user => {
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
                        return User.scope('includeDefaultStudyLanguage').findById(user.get(k.Attr.Id)).then(user => {
                            return cb(null, user);
                        });
                    });
                });
            });
        }
    });
});

module.exports = strategy;
