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
    callbackURL: config.get(k.OAuth.Twitter.CallbackURL),
    includeEmail: true
}, (token, tokenSecret, profile, cb) => {
    // let example = {
    //     id: '705578181558796288',
    //     displayName: 'Hank Ehly',
    //     emails: [{value: 'henry.ehly@gmail.com'}],
    //     photos: [{value: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}],
    //     provider: 'twitter'
    // };
    cb(null, {});
});

module.exports = strategy;
