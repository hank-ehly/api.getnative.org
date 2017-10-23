/**
 * storage
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/28.
 */

const config = require('../../config/application').config;
const logger = require('../../config/logger');
const k = require('../../config/keys.json');

const _ = require('lodash');

let client;
if ([k.Env.Test, k.Env.CircleCI].includes(config.get(k.ENVIRONMENT))) {
    const fs = require('fs');

    function TestFile() {
        this.name = 'TestFile';
    }

    client = {
        bucket: function() {
            return {
                upload: async function(filepath, options) {
                    return new Promise(resolve => {
                        const testTmpDst = [config.get(k.TempDir), '/', options.destination].join('');
                        fs.createReadStream(filepath).pipe(fs.createWriteStream(testTmpDst));
                        resolve([new TestFile()]);
                    });
                }
            }
        }
    };
} else {
    client = require('@google-cloud/storage')({
        projectId: config.get(k.GoogleCloud.ProjectId),
        keyFilename: config.get(k.GoogleCloud.KeyFilename)
    });
}

module.exports.upload = async function(filepath, destination) {
    if (!filepath || !destination) {
        throw new ReferenceError('arguments "filepath" and "destination" must be present');
    }

    if (!_.isString(filepath) || !_.isString(destination)) {
        throw new TypeError('arguments "filepath" and "destination" must be strings');
    }

    const options = {
        destination: destination,
        gzip: true,
        public: true
    };

    let data;
    try {
        data = await client.bucket(config.get(k.GoogleCloud.StorageBucketName)).upload(filepath, options);
    } catch (e) {
        logger.info(e, {json: true});
        return e;
    }

    return _.first(data);
};
