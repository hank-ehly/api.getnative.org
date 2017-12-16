/**
 * youtube
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/14.
 */

const google = require('googleapis');
const logger = require('../../config/logger');
const config = require('../../config/application').config;
const k = require('../../config/keys.json');
const service = google.youtube('v3');

/**
 * Return a list of video resources.
 *
 * @param {Array} idx
 * @param {Array} part
 * @param {String} hl
 * @return {Promise} A JSON object.
 */
module.exports.videosList = (idx, part = ['snippet'], hl = 'en') => {
    return new Promise(function(resolve, reject) {
        service.videos.list({
            id: idx.join(','),
            part: part.join(','),
            hl: hl,
            auth: config.get(k.GoogleCloud.APIKey)
        }, (err, response) => {
            if (err) {
                logger.error('The API returned an error: ' + err);
                reject(err);
            } else {
                resolve(createResource(response));
            }
        });
    });
};

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
