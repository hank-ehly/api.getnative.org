/**
 * storage
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/28.
 */

const config = require('../../config/application').config;
const k = require('../../config/keys.json');

const _ = require('lodash');

let client;
if ([k.Env.Test, k.Env.CircleCI].includes(config.get(k.ENVIRONMENT))) {
    client = {
        bucket: function() {
            return {
                upload: async function() {
                    return new Promise(resolve => {
                        function TestFile() {
                            this.name = 'TestFile';
                        }

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
        resumable: false,
        gzip: true,
        public: true
    };

    let data;
    try {
        data = await client.bucket(k.GoogleCloud.StorageBucketName).upload(filepath, options);
    } catch (e) {
        console.log(e);
    }

    return _.first(data);
};
