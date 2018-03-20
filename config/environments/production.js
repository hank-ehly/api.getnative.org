/**
 * production
 * api.getnative.org
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');
const OAuthConfig = require('../secrets/oauth.json');
const mailchimpConfig = require('../secrets/mailchimp.json').production;

const path = require('path');

const config = {};

config[k.API.Hostname] = 'api.getnative.org';

config[k.Client.Host] = 'getnative.org';
config[k.Client.Protocol] = 'https';
config[k.Client.BaseURI] = 'https://getnative.org';

config[k.EmailAddress.Contact] = 'contact@getnative.org';
config[k.EmailAddress.NoReply] = 'noreply@getnative.org';

config[k.GoogleCloud.APIKey] = require('../secrets/google_api_keys.json').production;
config[k.GoogleCloud.KeyFilename] = path.resolve(__dirname, '..', 'secrets', 'gcloud-credentials.json');
config[k.GoogleCloud.StorageBucketName] = 'getnative.org';

config[k.MailChimp.APIKey] = mailchimpConfig.apiKey;
config[k.MailChimp.User] = mailchimpConfig.user;
config[k.MailChimp.List.Newsletter] = mailchimpConfig.lists.newsletter;

config[k.OAuth.Facebook.ClientID] = OAuthConfig.production.facebook.clientId;
config[k.OAuth.Facebook.ClientSecret] = OAuthConfig.production.facebook.clientSecret;
config[k.OAuth.Facebook.CallbackURL] = 'https://api.getnative.org/oauth/facebook/callback';
config[k.OAuth.Twitter.ConsumerKey] = OAuthConfig.production.twitter.consumerKey;
config[k.OAuth.Twitter.ConsumerSecret] = OAuthConfig.production.twitter.consumerSecret;
config[k.OAuth.Twitter.CallbackURL] = 'https://api.getnative.org/oauth/twitter/callback';
config[k.OAuth.Google.ClientID] = OAuthConfig.production.google.clientId;
config[k.OAuth.Google.ClientSecret] = OAuthConfig.production.google.clientSecret;
config[k.OAuth.Google.CallbackURL] = 'https://api.getnative.org/oauth/google/callback';

config[k.SMTP.Port] = 25;

config[k.SendGrid.APIKey] = require('../secrets/sendgrid.json').production;

module.exports = config;
