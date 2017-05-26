/**
 * facebook
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const k        = require('../keys.json');
const User     = require('../../app/models')[k.Model.User];
const config   = require('../application').config;

const Strategy = require('passport-facebook').Strategy;

// todo: (*) Make sure time-out isn't an issue
// todo: Update user each authentication to make sure data is correct // web-hook
const strategy = new Strategy({
    clientID: config.get(k.OAuth.Facebook.ClientID),
    clientSecret: config.get(k.OAuth.Facebook.ClientSecret),
    profileFields: ['id', 'displayName', 'age_range', 'locale', 'photos', 'emails'],
    callbackURL: config.get(k.OAuth.Facebook.CallbackURL)
}, async (accessToken, refreshToken, profile, callback) => {
    return callback(null, await User.findOrCreateFromPassportProfile(profile));
});

module.exports = strategy;
