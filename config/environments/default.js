/**
 * base
 * get-native.com
 *
 * Created by henryehly on 2017/01/30.
 */

const k = require('../keys.json');
const oauthSecrets = require('../secrets/oauth.json');

const defaults = {};

defaults[k.API.Port] = 3000;
defaults[k.Header.AccessControlAllowOrigin] = '*';
defaults[k.SMTP.Port] = 1025;
defaults[k.SMTP.Host] = 'localhost';
defaults[k.API.Hostname] = 'localhost';
defaults[k.Client.Host] = 'localhost:5555';
defaults[k.NoReply] = 'noreply@localhost';
defaults[k.DefaultLocale] = 'en';
defaults[k.Client.Protocol] = 'http';

defaults[k.Client.BaseURI] = 'http://localhost:5555';

defaults[k.OAuth.Facebook.ClientID] = oauthSecrets.development.facebook.clientId;
defaults[k.OAuth.Facebook.ClientSecret] = oauthSecrets.development.facebook.clientSecret;
defaults[k.OAuth.Facebook.CallbackURL] = 'http://localhost:3000/oauth/facebook/callback';

defaults[k.OAuth.Twitter.ConsumerKey] = oauthSecrets.development.twitter.consumerKey;
defaults[k.OAuth.Twitter.ConsumerSecret] = oauthSecrets.development.twitter.consumerSecret;
defaults[k.OAuth.Twitter.CallbackURL] = 'http://localhost:3000/oauth/twitter/callback';

defaults[k.GoogleCloud.ProjectId] = 'stg-get-native';

module.exports = defaults;
