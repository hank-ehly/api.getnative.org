/**
 * upload-profile-image
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/09/11.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services/utility');
const config = require('../../../config/application').config;
const db = require('../../../app/models');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

describe('POST /users/profile_image', function() {
    let user, server, authorization, imagePath = path.resolve(__dirname, '..', '..', 'fixtures', 'speaker.jpg');

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login();
        authorization = results.authorization;
        server = results.server;
        user = await results.db[k.Model.User].findByPrimary(results.response.body[k.Attr.Id]);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the image field is missing', function() {
            return request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).expect(400);
        });
    });

    describe('success', function() {
        before(function() {
            fs.mkdirSync(path.resolve(config.get(k.TempDir), 'users'));
        });

        afterEach(function() {
            const files = fs.readdirSync(path.resolve(config.get(k.TempDir), 'users'));
            _.each(files, function(file) {
                fs.unlinkSync(path.resolve(config.get(k.TempDir), 'users', file));
            });
        });

        after(function() {
            fs.rmdirSync(path.resolve(config.get(k.TempDir), 'users'));
        });

        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it(`should return 200 OK for a valid request`, function() {
            return request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath).expect(200);
        });

        it('should save a new image asset with the appropriate hash title to Google Cloud Storage', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            await user.reload();

            const startIndex = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/users/`.length;
            let filename = user.get(k.Attr.PictureUrl).substring(startIndex);

            const expectedHash = Utility.getHashForId(user.get(k.Attr.Id));
            const expectedImagePath = path.resolve(config.get(k.TempDir), 'users', filename);

            assert(fs.existsSync(expectedImagePath));
        });

        it('should set the "is_silhouette_image" of the user record to false', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            await user.reload();
            assert.equal(user[k.Attr.IsSilhouettePicture], false);
        });

        it("should set the user record 'picture_url' to the public url of the uploaded image", async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            await user.reload();
            const actualUrl = user.get(k.Attr.PictureUrl);
            const userIdHash = Utility.getHashForId(user.get(k.Attr.Id));
            assert(_.startsWith(actualUrl, `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/users/${userIdHash}`));
        });

        it('should return the picture_url', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const response = await request(server).post('/users/profile_image').set(k.Header.Authorization, authorization).attach('image', imagePath);
            await user.reload();
            assert.equal(response.body[k.Attr.PictureUrl], user.get(k.Attr.PictureUrl));
        });
    });
});
