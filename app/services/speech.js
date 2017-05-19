/**
 * speech
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/19.
 */

const config = require('../../config');
const k      = require('../../config/keys.json');

const speech = require('@google-cloud/speech')({
    projectId: config.get(k.GoogleCloud.ProjectId),
    keyFilename: config.get(k.GoogleCloud.KeyFilename)
});

module.export = speech;
