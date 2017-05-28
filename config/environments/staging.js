/**
 * staging
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');
const oauthSecrets = require('../secrets/oauth.json');

const config = {};

config[k.Header.AccessControlAllowOrigin] = 'https://stg.get-native.com';
config[k.API.Hostname] = 'stg.api.get-native.com';
config[k.SMTP.Port] = 25;
config[k.Client.Host] = 'stg.get-native.com';
config[k.Client.Protocol] = 'https';
config[k.NoReply] = 'noreply@stg.get-native.com';
config[k.Client.BaseURI] = 'https://stg.get-native.com';

config[k.OAuth.Facebook.ClientID] = oauthSecrets.staging.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = oauthSecrets.staging.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'https://api.stg.get-native.com/oauth/facebook/callback';

config[k.OAuth.Twitter.ConsumerKey] = oauthSecrets.staging.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = oauthSecrets.staging.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'https://api.stg.get-native.com/oauth/twitter/callback';

config[k.OAuth.Google.ClientID] = oauthSecrets.staging.google.clientId;
config[k.OAuth.Google.ClientSecret] = oauthSecrets.staging.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'https://api.stg.get-native.com/oauth/google/callback';

module.exports = config;
