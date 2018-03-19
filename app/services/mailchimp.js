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
const querystring = require('querystring');
const _ = require('lodash');


function MailChimpAPI(apiKey, user, options) {
    options = options || {};

    this.apiKey = apiKey;
    this.user = user;
    let datacenter = apiKey.split('-');
    datacenter = datacenter[datacenter.length - 1];
    this.httpUri = 'https://' + datacenter + '.api.mailchimp.com' + '/3.0';
    this.userAgent = options.userAgent + ' ' || '';
}

MailChimpAPI.prototype.execute = function(action, method, whiteListParams, givenParams) {
    let params = {};
    let currentParam;

    for (let i = 0; i < whiteListParams.length; i++) {
        currentParam = whiteListParams[i];
        if (_.has(givenParams, currentParam)) {
            params[currentParam] = givenParams[currentParam];
        }
    }

    return new Promise((resolve, reject) => {
        const uri = [this.httpUri, action].join('/');

        logger.debug(`${method} ${uri}`);

        const requestConfig = {
            auth: {
                user: this.user,
                pass: this.apiKey
            },
            uri: uri,
            method: method,
            headers: {
                'Accept-Encoding': ['gzip', 'deflate'].join(',')
            },
            gzip: true
        };

        if (method === 'GET') {
            requestConfig['qs'] = params;
        } else {
            requestConfig['body'] = JSON.stringify(params);
        }

        request(requestConfig, (error, response, body) => {
            let parsedResponse;

            if (error) {
                return reject(new Error('Unable to connect to the MailChimp API endpoint because ' + error.message));
            }

            if (response.statusCode === 204) {
                return resolve();
            }

            try {
                parsedResponse = JSON.parse(body);
            } catch (error) {
                return reject(new Error('Error parsing JSON answer from MailChimp API: ' + body));
            }

            if (response.statusCode !== 200 || parsedResponse.status === 'error') {
                return reject(createMailChimpError(parsedResponse));
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

MailChimpAPI.prototype.listsMembersUpdateOrCreate = function(listId, subscriberHash, params) {
    const whiteList = [
        'email_address',
        'status_if_new',
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

    return this.execute('lists/' + listId + '/members/' + subscriberHash, 'PUT', whiteList, params);
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

MailChimpAPI.prototype.listsMembersDelete = function(listId, subscriberHash, params) {
    return this.execute('lists/' + listId + '/members/' + subscriberHash, 'DELETE', [], params);
};

MailChimpAPI.prototype.listsMembersRead = function(listId, subscriberHash, params) {
    const whiteList = [
        'fields', 'exclude_fields'
    ];

    return this.execute('lists/' + listId + '/members/' + subscriberHash, 'GET', whiteList, params);
};

function createMailChimpError(response) {
    const error = new Error(`[${response.status}] ${response.title} - ${response.detail}`);

    error.code = response.status;

    return error;
}

let api;
if (config.isTest()) {
    api = function() {
    }
} else {
    api = new MailChimpAPI(config.get(k.MailChimp.APIKey), config.get(k.MailChimp.User));
}

module.exports = api;
