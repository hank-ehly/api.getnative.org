/**
 * speech
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/19.
 */

const config = require('../../config/application').config;
const k      = require('../../config/keys.json');

const Speech = require('@google-cloud/speech');

let client;

// in addition to replacing test-results with a key, separate keys like 'kNameOfKey' from keys whose names are actually used
// in keys.json (ex. Credential) is the actual name of a model and there should probably be a model-names.json or something
if (![k.Env.Test, k.Env.CircleCI].includes(config.get(k.ENVIRONMENT))) {
    client = Speech({
        projectId: config.get(k.GoogleCloud.ProjectId),
        keyFilename: config.get(k.GoogleCloud.KeyFilename) // todo: ??
    });
} else {
    client = {
        recognize: function(file, config, callback) {
            callback(null, 'test-results');
        }
    };
}

module.exports = client;
