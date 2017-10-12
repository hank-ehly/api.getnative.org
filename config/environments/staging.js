/**
 * staging
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');
const OAuthConfig = require('../secrets/oauth.json');

const config = {};

config[k.API.Hostname] = 'stg.api.getnativelearning.com';

config[k.Client.Host] = 'stg.getnativelearning.com';
config[k.Client.Protocol] = 'https';
config[k.Client.BaseURI] = 'https://stg.getnativelearning.com';

config[k.EmailAddress.Contact] = 'contact@getnativelearning.com';
config[k.EmailAddress.NoReply] = 'noreply@stg.getnativelearning.com';

config[k.GoogleCloud.StorageBucketName] = 'stg.getnativelearning.com';

config[k.OAuth.Facebook.ClientID] = OAuthConfig.staging.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = OAuthConfig.staging.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'https://api.stg.getnativelearning.com/oauth/facebook/callback';
config[k.OAuth.Twitter.ConsumerKey] = OAuthConfig.staging.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = OAuthConfig.staging.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'https://api.stg.getnativelearning.com/oauth/twitter/callback';
config[k.OAuth.Google.ClientID] = OAuthConfig.staging.google.clientId;
config[k.OAuth.Google.ClientSecret] = OAuthConfig.staging.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'https://api.stg.getnativelearning.com/oauth/google/callback';

config[k.SMTP.Port] = 25;

module.exports = config;
