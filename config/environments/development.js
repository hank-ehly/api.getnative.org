/**
 * development
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/27.
 */

const k = require('../keys.json');
const oauthSecrets = require('../secrets/oauth.json');

const config = {};

config[k.GoogleCloud.StorageBucketName] = 'ungoogly-brand-9505';

config[k.OAuth.Facebook.ClientID] = oauthSecrets.development.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = oauthSecrets.development.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'http://localhost:3000/oauth/facebook/callback';

config[k.OAuth.Twitter.ConsumerKey] = oauthSecrets.development.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = oauthSecrets.development.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'http://localhost:3000/oauth/twitter/callback';

config[k.OAuth.Google.ClientID] = oauthSecrets.development.google.clientId;
config[k.OAuth.Google.ClientSecret] = oauthSecrets.development.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'http://localhost:3000/oauth/google/callback';

module.exports = config;
