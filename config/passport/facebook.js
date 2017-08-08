/**
 * facebook
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/12.
 */

const k        = require('../keys.json');
const User     = require('../../app/models')[k.Model.User];
const config   = require('../application').config;

const Strategy = require('passport-facebook').Strategy;

// todo: Update user info on facebook profile change web hook
const strategy = new Strategy({
    clientID: config.get(k.OAuth.Facebook.ClientID),
    clientSecret: config.get(k.OAuth.Facebook.ClientSecret),
    profileFields: ['id', 'displayName', 'age_range', 'locale', 'photos', 'emails'],
    callbackURL: config.get(k.OAuth.Facebook.CallbackURL),
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, callback) => {
    return callback(null, await User.findOrCreateFromPassportProfile(profile, req));
});

module.exports = strategy;
