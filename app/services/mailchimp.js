/**
 * mailchimp
 * api.getnativelearning.com
 *
 * Created by henryehly on 2018/03/13.
 */

const k = require('../../config/keys.json');
const config = require('../../config/application').config;
const logger = require('../../config/logger');
const request = require('request');
const _ = require('lodash');


function MailChimpAPI(apiKey, options) {
    options = options || {};

    this.version = '3.0';
    this.apiKey = apiKey;
    this.packageInfo = options.packageInfo;
    let datacenter = apiKey.split('-');
    datacenter = datacenter[datacenter - 1];
    this.httpHost = datacenter + '.api.mailchimp.com';
    this.httpUri = 'https://' + this.httpHost + ':443';
    this.userAgent = options.userAgent + ' ' || '';
}

MailChimpAPI.prototype.execute = function(action, method, availableParams, givenParams) {
    let finalParams = {apikey: this.apiKey};
    let currentParam;

    for (let i = 0; i < availableParams.length; i++) {
        currentParam = availableParams[i];
        if (_.has(givenParams, currentParam)) {
            finalParams[currentParam] = givenParams[currentParam];
        }
    }

    return new Promise((resolve, reject) => {
        request({
            uri: [this.httpUri, this.version, action].join('/'),
            method: method,
            headers: {
                'User-Agent': [this.userAgent, this.packageInfo.version].join('/'),
                'Accept-Encoding': ['gzip', 'deflate'].join(',')
            },
            gzip: true,
            body: JSON.stringify(finalParams)
        }, function(error, response, body) {
            let parsedResponse;

            if (error) {
                return reject(new Error('Unable to connect to the MailChimp API endpoint because ' + error.message));
            }

            try {
                parsedResponse = JSON.parse(body);
            } catch (error) {
                return reject(new Error('Error parsing JSON answer from MailChimp API: ' + body));
            }

            if (response.statusCode !== 200 || parsedResponse.status === 'error') {
                return reject(createMailChimpError(parsedResponse.error, parsedResponse.code));
            }

            resolve(parsedResponse);
        });
    });
};

MailChimpAPI.prototype.listsMembersCreate = function(listId, params, callback) {
    if (_.isFunction(params)) {
        callback = params;
        params = {};
    }

    this.execute('lists/' + listId + '/members', 'POST', [
        'email_address',
        'email_type',
        'status',
        'merge_fields',
        'interests',
        'languages',
        'vip',
        'location',
        'ip_signup',
        'timestamp_signup',
        'ip_opt',
        'timestamp_opt'
    ], params, callback);
};

MailChimpAPI.prototype.listsMembersUpdate = function(listId, subscriberHash, params, callback) {
    if (_.isFunction(params)) {
        callback = params;
        params = {};
    }

    this.execute('lists/' + listId + '/members/' + subscriberHash, 'PATCH', [
        'email_address',
        'email_type',
        'status',
        'merge_fields',
        'interests',
        'languages',
        'vip',
        'location',
        'ip_signup',
        'timestamp_signup',
        'ip_opt',
        'timestamp_opt'
    ], params, callback);
};

function createMailChimpError(message, code) {
    const error = new Error(message || (message = ''));

    if (code) {
        error.code = code;
    }

    return error;
}

const api = new MailChimpAPI(config(k.MailChimp.APIKey));

module.exports = api;
