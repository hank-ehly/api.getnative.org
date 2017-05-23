/**
 * twitter
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/24.
 */

const config          = require('../application').config;
const k               = require('../keys.json');

const TwitterStrategy = require('passport-twitter').Strategy;

const strategy = new TwitterStrategy({
    consumerKey: config.get(k.OAuth.Twitter.ConsumerKey),
    consumerSecret: config.get(k.OAuth.Twitter.ConsumerSecret),
    callbackURL: config.get(k.OAuth.Twitter.CallbackURL)
}, (token, tokenSecret, profile, cb) => {
    console.log(profile);
    cb(null, {});
});

module.exports = strategy;
