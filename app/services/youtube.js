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
                resolve(response);
            }
        });
    });
};
