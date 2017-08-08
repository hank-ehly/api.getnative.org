/**
 * twitter
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/24.
 */

const k        = require('../keys.json');
const User     = require('../../app/models')[k.Model.User];
const config   = require('../application').config;

const Strategy = require('passport-twitter').Strategy;

const strategy = new Strategy({
    consumerKey: config.get(k.OAuth.Twitter.ConsumerKey),
    consumerSecret: config.get(k.OAuth.Twitter.ConsumerSecret),
    callbackURL: config.get(k.OAuth.Twitter.CallbackURL),
    includeEmail: true,
    passReqToCallback: true
}, async (req, token, tokenSecret, profile, callback) => {
    return callback(null, await User.findOrCreateFromPassportProfile(profile, req));
});

module.exports = strategy;
