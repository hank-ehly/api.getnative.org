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

defaults[k.OAuth.Facebook.CallbackURL] = defaults[k.Client.Protocol] + '://' + defaults[k.API.Hostname] + ':' + defaults[k.API.Port] + '/oauth/facebook/callback';
defaults[k.OAuth.Facebook.ClientID] = '215586025582003';
defaults[k.OAuth.Facebook.ClientSecret] = 'a27245e5fee9aa9b324c159b895db0aa';

defaults[k.GoogleCloud.ProjectId] = 'stg-get-native';

module.exports = defaults;
