/**
 * production
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');
const OAuthConfig = require('../secrets/oauth.json');

const config = {};

config[k.API.Hostname] = 'api.getnativelearning.com';

config[k.Client.Host] = 'getnativelearning.com';
config[k.Client.Protocol] = 'https';
config[k.Client.BaseURI] = 'https://getnativelearning.com';

config[k.EmailAddress.Contact] = 'contact@getnativelearning.com';
config[k.EmailAddress.NoReply] = 'noreply@getnativelearning.com';

config[k.GoogleCloud.StorageBucketName] = 'getnativelearning.com';

config[k.OAuth.Facebook.ClientID] = OAuthConfig.production.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = OAuthConfig.production.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'https://api.getnativelearning.com/oauth/facebook/callback';
config[k.OAuth.Twitter.ConsumerKey] = OAuthConfig.production.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = OAuthConfig.production.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'https://api.getnativelearning.com/oauth/twitter/callback';
config[k.OAuth.Google.ClientID] = OAuthConfig.production.google.clientId;
config[k.OAuth.Google.ClientSecret] = OAuthConfig.production.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'https://api.getnativelearning.com/oauth/google/callback';

config[k.SMTP.Port] = 25;

module.exports = config;
