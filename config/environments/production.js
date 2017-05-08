/**
 * production
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');

const config = {};

config[k.Header.AccessControlAllowOrigin] = 'https://get-native.com';
config[k.API.Hostname] = 'api.get-native.com';
config[k.SMTP.Port] = 25;
config[k.Client.Host] = 'get-native.com';
config[k.Client.Protocol] = 'https';
config[k.NoReply] = 'noreply@get-native.com';

module.exports = config;
