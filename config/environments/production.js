/**
 * production
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../keys.json');

const config = {};

config[k.Header.AccessControlAllowOrigin] = 'https://getnativelearning.com';
config[k.API.Hostname] = 'api.getnativelearning.com';
config[k.SMTP.Port] = 25;
config[k.Client.Host] = 'getnativelearning.com';
config[k.Client.Protocol] = 'https';
config[k.NoReply] = 'noreply@getnativelearning.com';
config[k.GoogleCloud.StorageBucketName] = 'getnativelearning.com';
config[k.EmailAddress.Contact] = 'contact@getnativelearning.com';

module.exports = config;
