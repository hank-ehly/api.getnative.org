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

module.exports = defaults;
