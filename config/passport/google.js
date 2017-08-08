/**
 * google
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/26.
 */

const k        = require('../keys.json');
const User     = require('../../app/models')[k.Model.User];
const config   = require('../application').config;

const Strategy = require('passport-google-oauth20').Strategy;

const strategy = new Strategy({
    clientID: config.get(k.OAuth.Google.ClientID),
    clientSecret: config.get(k.OAuth.Google.ClientSecret),
    callbackURL: config.get(k.OAuth.Google.CallbackURL),
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, callback) => {
    return callback(null, await User.findOrCreateFromPassportProfile(profile, req));
});

module.exports = strategy;
