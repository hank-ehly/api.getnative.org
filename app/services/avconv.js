/**
 * avconv
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/29.
 */

const randomHash = require('./auth').generateRandomHash;

const exec = require('child_process').exec;
const _ = require('lodash');

module.exports.videoToFlac = function(filepath) {
    if (!filepath) {
        throw new ReferenceError('argument filepath is missing');
    }

    if (!_.isString(filepath)) {
        throw new TypeError('argument filepath must be a string');
    }

    const outputFilePath = '/tmp/' + randomHash() + '.flac';

    return new Promise((resolve, reject) => {
        exec(`/usr/bin/env avconv -i ${filepath} ${outputFilePath}`, err => {
            if (err) {
                reject(err);
            } else {
                resolve(outputFilePath);
            }
        });
    });
};
