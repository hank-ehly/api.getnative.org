/**
 * base
 * get-native.com
 *
 * Created by henryehly on 2017/01/30.
 */

const k = require('../keys.json');

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

defaults[k.OAuth.Facebook.ClientID] = 'xxx';
defaults[k.OAuth.Facebook.ClientSecret] = 'xxx';
defaults[k.OAuth.Facebook.CallbackURL] = 'http://localhost:3000/oauth/facebook/callback';
defaults[k.OAuth.Twitter.ConsumerKey] = 'xxx';
defaults[k.OAuth.Twitter.ConsumerSecret] = 'xxx';
defaults[k.OAuth.Twitter.CallbackURL] = 'http://localhost:3000/oauth/twitter/callback';
defaults[k.OAuth.Google.ClientID] = 'xxx';
defaults[k.OAuth.Google.ClientSecret] = 'xxx';
defaults[k.OAuth.Google.CallbackURL] = 'http://localhost:3000/oauth/google/callback';

defaults[k.GoogleCloud.ProjectId] = 'stg-get-native';

module.exports = defaults;
