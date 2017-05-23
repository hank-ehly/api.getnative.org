/**
 * facebook
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

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

const FacebookStrategy = require('passport-facebook').Strategy;
const _ = require('lodash');

// todo: Refactor
// todo: Test
// todo: (*) Make sure time-out isn't an issue
// todo: Update user each authentication to make sure data is correct // web-hook
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

    // {
    //     id: '2545994211381',
    //     username: undefined,
    //     displayName: 'Hank Ehly',
    //     name: {
    //         familyName: undefined,
    //         givenName: undefined,
    //         middleName: undefined
    //     },
    //     gender: undefined,
    //     profileUrl: undefined,
    //     emails: [{value: 'henry.ehly@gmail.com'}],
    //     photos: [{value: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/16807431_2546476943449_5422516981354096077_n.jpg?oh=8670d7a5566fe6ea2237da52be7ecef5&oe=599EA663'}],
    //     provider: 'facebook'
    // }

    const cache = {};

    // check if another user exists with the same email
    return User.findOne({
        where: {
            email: _.first(profile.emails).value
        }
    }).then(user => {
        // IF: exists
        if (user) {
            // THEN:
            // IF: that user has a 'facebook' identity
            return AuthAdapterType.findOne({
                where: {
                    name: 'facebook'
                },
                attributes: [
                    k.Attr.Id
                ]
            }).then(adapter => {
                cache.adapter = adapter;

                return Identity.findOne({
                    where: {
                        user_id: user.get(k.Attr.Id),
                        auth_adapter_type_id: adapter.get(k.Attr.Id)
                    }
                });
            }).then(identity => {
                if (identity) {
                    // THEN: get the user data and invoke the callback
                    return User.scope('includeDefaultStudyLanguage').findById(identity.get(k.Attr.UserId)).then(user => {
                        return cb(null, user);
                    });
                } else {
                    // ELSE: create a 'facebook' identity for the user and invoke the callback with the user data
                    return Identity.create({
                        user_id: user.get(k.Attr.Id),
                        auth_adapter_type_id: cache.adapter.get(k.Attr.Id),
                        auth_adapter_user_id: _.toString(profile[k.Attr.Id])
                    }).then(() => {
                        return cb(null, user);
                    });
                }
            });
        }

        // IF: not exists
        else {
            // THEN: create a user record and identity record of 'facebook' type && invoke callback with user data
            return Language.findOne({
                where: {
                    code: 'en'
                }
            }).then(language => {
                const user = {
                    email: _.first(profile.emails).value,
                    default_study_language_id: language.get(k.Attr.Id)
                };

                if (profile.photos && _.gt(_.size(profile.photos), 0)) {
                    user[k.Attr.PictureUrl] = _.first(profile.photos).value;
                    user[k.Attr.IsSilhouettePicture] = false;
                }

                return User.create(user);
            }).then(user => {
                return AuthAdapterType.findOne({
                    where: {
                        name: 'facebook'
                    },
                    attributes: [
                        k.Attr.Id
                    ]
                }).then(adapter => {
                    return Identity.create({
                        user_id: user.get(k.Attr.Id),
                        auth_adapter_type_id: adapter.get(k.Attr.Id),
                        auth_adapter_user_id: _.toString(profile[k.Attr.Id])
                    });
                }).then(() => {
                    return cb(null, user);
                });
            });
        }
    });
});

module.exports = strategy;
