/**
 * picture.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/13.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services/utility');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const chance = require('chance').Chance();
const fs = require('fs');
const _ = require('lodash');

describe('POST /speakers/:id/picture', function() {
    let authorization, server, db, speaker;
    const pictureFile = path.resolve(__dirname, '..', '..', 'fixtures', 'speaker.jpg');

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        server = results.server;
        authorization = results.authorization;
        db = results.db;
        speaker = await db[k.Model.Speaker].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        let pictureFile;

        it('should respond with 400 Bad Request if the "id" parameter is not a number', function() {
            return request(server).post(`/speakers/not_a_number/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile).expect(400);
        });

        it('should respond with 400 Bad Request if the "id" parameter is 0', function() {
            return request(server).post('/speakers/0/picture').set(k.Header.Authorization, authorization).attach('picture', pictureFile).expect(400);
        });

        it('should respond with 400 Bad Request if the "picture" field is missing', function() {
            return request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).expect(400);
        });
    });

    describe('success', function() {
        before(function() {
            fs.mkdirSync(path.resolve(config.get(k.TempDir), 'speakers'));
        });

        afterEach(function() {
            const files = fs.readdirSync(path.resolve(config.get(k.TempDir), 'speakers'));
            _.each(files, function(file) {
                fs.unlinkSync(path.resolve(config.get(k.TempDir), 'speakers', file));
            });
        });

        after(function() {
            fs.rmdirSync(path.resolve(config.get(k.TempDir), 'speakers'));
        });

        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a valid request', function() {
            return request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile).expect(200);
        });

        it('should respond with the Speaker record "picture_url" string', async function() {
            const response = await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            const idHash = Utility.getHashForId(speaker.get(k.Attr.Id));
            const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/speakers/${idHash}.${config.get(k.ImageFileExtension)}`;
            assert.equal(response.body[k.Attr.PictureUrl], expectedUrl);
        });

        it('should set the Speaker record "is_silhouette_picture" to false', async function() {
            await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            await speaker.reload();
            assert.equal(speaker.get(k.Attr.IsSilhouettePicture), false);
        });

        it('should set the Speaker record "picture_url" to the url of the uploaded file', async function() {
            await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            await speaker.reload();
            const idHash = Utility.getHashForId(speaker.get(k.Attr.Id));
            const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/speakers/${idHash}.${config.get(k.ImageFileExtension)}`;
            assert.equal(speaker.get(k.Attr.PictureUrl), expectedUrl);
        });

        it('should upload the image file to /speakers/{id hash}', async function() {
            await request(server).post(`/speakers/${speaker.get(k.Attr.Id)}/picture`).set(k.Header.Authorization, authorization).attach('picture', pictureFile);
            const idHash = Utility.getHashForId(speaker.get(k.Attr.Id));
            const uploadedPicturePath = path.resolve(config.get(k.TempDir), 'speakers', idHash + '.' + config.get(k.ImageFileExtension));
            assert(fs.existsSync(uploadedPicturePath));
        });
    });
});
