/**
 * speech
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/19.
 */

const config = require('../../config/application').config;
const k      = require('../../config/keys.json');

const avconv = require('./avconv');

const _ = require('lodash');

let client;

if (![k.Env.Test, k.Env.CircleCI].includes(config.get(k.ENVIRONMENT))) {
    const speech = require('@google-cloud/speech');
    client = new speech.SpeechClient({
        projectId: config.get(k.GoogleCloud.ProjectId),
        keyFilename: config.get(k.GoogleCloud.KeyFilename)
    });
} else {
    client = {
        recognize: function(filepath, options, callback) {
            callback(null, 'test-result');
        }
    };
}

module.exports.transcribeVideo = async function(filepath, languageCode = 'en-US') {
    if (!filepath) {
        throw new ReferenceError('argument filepath is missing');
    }

    if (!_.isString(filepath)) {
        throw new TypeError('argument filepath must be a string');
    }

    if (!_.isString(languageCode)) {
        throw new TypeError('argument languageCode must be a string');
    }

    const audioFilePath = await avconv.videoToFlac(filepath);

    return new Promise((resolve, reject) => {
        const options = {
            encoding: 'FLAC',
            sampleRateHertz: 44100,
            languageCode: languageCode
        };

        client.recognize(audioFilePath, options, (err, transcript) => {
            if (err) {
                reject(err);
            } else {
                resolve(transcript);
            }
        });
    });
};
