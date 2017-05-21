/**
 * staging
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');

const config = {};

config[k.Header.AccessControlAllowOrigin] = 'https://stg.get-native.com';
config[k.API.Hostname] = 'stg.api.get-native.com';
config[k.SMTP.Port] = 25;
config[k.Client.Host] = 'stg.get-native.com';
config[k.Client.Protocol] = 'https';
config[k.NoReply] = 'noreply@stg.get-native.com';
config[k.OAuth.Facebook.ClientID] = '215585938915345';
config[k.OAuth.Facebook.ClientSecret] = '48d86be6bfdcfcab1a491c890c01e89a';

module.exports = config;
