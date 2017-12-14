/**
 * youtube
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/14.
 */

const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const config = require('../../config/application').config;
const k = require('../../config/keys.json');
const logger = require('../../config/logger');

module.videosListMultipleIds = (idx, part = 'snippet') => {
    authorize(config.get(k.GoogleCloud.OAuth2ClientSecret).web, {
        params: {
            id: idx.join(','),
            part: part
        }
    }, (auth, requestData) => {
        const service = google.youtube('v3');
        const parameters = removeEmptyParameters(requestData['params']);
        parameters['auth'] = auth;
        service.videos.list(parameters, function(err, response) {
            if (err) {
                logger.error('The API returned an error: ' + err);
                return;
            }
            return createResource(response);
        });
    });
};

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'google-apis-youtube-oauth-token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {String} credentials.client_secret
 * @param {String} credentials.client_id
 * @param {Array} credentials.redirect_uris
 * @param {Object} requestData
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, requestData, callback) {
    const clientSecret = credentials.client_secret;
    const clientId = credentials.client_id;
    const redirectUrl = credentials.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, requestData, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client, requestData);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {Object} oauth2Client The OAuth2 client to get token for.
 * @param {function} requestData
 * @param {function} callback The callback to call with the authorized client.
 */
function getNewToken(oauth2Client, requestData, callback) {
    let authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    logger.info('Authorize this app by visiting this url: ', authUrl);
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                logger.error('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client, requestData);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    logger.info('Token stored to ' + TOKEN_PATH);
}

/**
 * Remove parameters that do not have values.
 *
 * @param {Object} params A list of key-value pairs representing request parameters and their values.
 * @return {Object} The params object minus parameters with no values set.
 */
function removeEmptyParameters(params) {
    for (let p in params) {
        if (!params[p] || params[p] === 'undefined') {
            delete params[p];
        }
    }
    return params;
}

/**
 * Create a JSON object, representing an API resource, from a list of
 * properties and their values.
 *
 * @param {Object} properties A list of key-value pairs representing resource properties and their values.
 * @return {Object} A JSON object. The function nests properties based on periods (.) in property names.
 */
function createResource(properties) {
    let resource = {};
    let normalizedProps = properties;
    for (let p in properties) {
        let value = properties[p];
        if (p && p.substr(-2, 2) == '[]') {
            let adjustedName = p.replace('[]', '');
            if (value) {
                normalizedProps[adjustedName] = value.split(',');
            }
            delete normalizedProps[p];
        }
    }
    for (let p in normalizedProps) {
        // Leave properties that don't have values out of inserted resource.
        if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
            let propArray = p.split('.');
            let ref = resource;
            for (let pa = 0; pa < propArray.length; pa++) {
                let key = propArray[pa];
                if (pa == propArray.length - 1) {
                    ref[key] = normalizedProps[p];
                } else {
                    ref = ref[key] = ref[key] || {};
                }
            }
        }
    }
    return resource;
}
