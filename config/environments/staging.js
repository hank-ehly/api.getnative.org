/**
 * staging
 * api.getnative.org
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');
const OAuthConfig = require('../secrets/oauth.json');
const mailchimpConfig = require('../secrets/mailchimp.json').staging;

const path = require('path');

const config = {};

config[k.API.Port] = 3005;
config[k.API.Hostname] = 'stg.api.getnative.org';

config[k.Client.Host] = 'stg.getnative.org';
config[k.Client.Protocol] = 'https';
config[k.Client.BaseURI] = 'https://stg.getnative.org';

config[k.EmailAddress.Contact] = 'contact@getnative.org';
config[k.EmailAddress.NoReply] = 'noreply@stg.getnative.org';

config[k.GoogleCloud.APIKey] = require('../secrets/google_api_keys.json').staging;
config[k.GoogleCloud.KeyFilename] = path.resolve(__dirname, '..', 'secrets', 'gcloud-credentials.json');
config[k.GoogleCloud.StorageBucketName] = 'stg.getnative.org';

config[k.MailChimp.APIKey] = mailchimpConfig.apiKey;
config[k.MailChimp.User] = mailchimpConfig.user;
config[k.MailChimp.List.Newsletter] = mailchimpConfig.lists.newsletter;

config[k.OAuth.Facebook.ClientID] = OAuthConfig.staging.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = OAuthConfig.staging.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'https://api.stg.getnative.org/oauth/facebook/callback';
config[k.OAuth.Twitter.ConsumerKey] = OAuthConfig.staging.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = OAuthConfig.staging.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'https://api.stg.getnative.org/oauth/twitter/callback';
config[k.OAuth.Google.ClientID] = OAuthConfig.staging.google.clientId;
config[k.OAuth.Google.ClientSecret] = OAuthConfig.staging.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'https://api.stg.getnative.org/oauth/google/callback';

config[k.SMTP.Host] = 'smtp.mailtrap.io';
config[k.SMTP.Port] = 2525;
config[k.SMTP.Auth.User] = 'ba8aeeb50b2007';
config[k.SMTP.Auth.Pass] = '16f902b7fbcd0f';

module.exports = config;
