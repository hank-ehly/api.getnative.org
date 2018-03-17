/**
 * mailchimp
 * api.getnative.org
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

    this.apiKey = apiKey;
    let datacenter = apiKey.split('-');
    datacenter = datacenter[datacenter.length - 1];
    this.httpUri = 'https://' + datacenter + '.api.mailchimp.com' + '/3.0';
    this.userAgent = options.userAgent + ' ' || '';
}

MailChimpAPI.prototype.execute = function(action, method, whiteListParams, givenParams) {
    let finalParams = {apikey: this.apiKey};
    let currentParam;

    for (let i = 0; i < whiteListParams.length; i++) {
        currentParam = whiteListParams[i];
        if (_.has(givenParams, currentParam)) {
            finalParams[currentParam] = givenParams[currentParam];
        }
    }

    return new Promise((resolve, reject) => {
        request({
            uri: [this.httpUri, action].join('/'),
            method: method,
            headers: {
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

MailChimpAPI.prototype.listsMembersCreate = function(listId, params) {
    const whiteList = [
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
    ];

    return this.execute('lists/' + listId + '/members', 'POST', whiteList, params);
};

MailChimpAPI.prototype.listsMembersUpdate = function(listId, subscriberHash, params) {
    const whiteList = [
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
    ];

    return this.execute('lists/' + listId + '/members/' + subscriberHash, 'PATCH', whiteList, params);
};

function createMailChimpError(message, code) {
    const error = new Error(message || (message = ''));

    if (code) {
        error.code = code;
    }

    return error;
}

let api;
if (config.isTest()) {
    api = function() {};
} else {
    api = new MailChimpAPI(config.get(k.MailChimp.APIKey));
}

module.exports = api;
