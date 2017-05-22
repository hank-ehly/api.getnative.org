/**
 * facebook
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const FacebookStrategy = require('passport-facebook').Strategy;
const config     = require('../application').config;
const logger     = require('../logger');
const k          = require('../keys.json');

const strategy = new FacebookStrategy({
    clientID: config.get(k.OAuth.Facebook.ClientID),
    clientSecret: config.get(k.OAuth.Facebook.ClientSecret),
    profileFields: ['emails', 'gender', 'displayName', 'name', 'profileUrl'],
    callbackURL: config.get(k.OAuth.Facebook.CallbackURL)
}, function(accessToken, refreshToken, profile, cb) {
    // find user by their facebook ID
    // if none exists, create new user

    // const s = `
    //     SELECT U.id FROM users U LEFT JOIN identities I ON U.id = I.user_id WHERE I.adapter_type = 'facebook' AND I.adapter_user_id = ${profile.userId}
    // `;

    // Identities.findOne({
    //     where: {
    //         adapter_type: k.AdapterType.Facebook,
    //         adapter_user_id: profile.userId
    //     }
    // }, attributes: [k.Attr.UserId])

    logger.info('Access Token:', accessToken);
    logger.info('Refresh Token:', refreshToken);
    logger.info('Profile:', profile);
    return cb(null, profile);
});

module.exports = strategy;
