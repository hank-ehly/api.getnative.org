/**
 * upload.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/16.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services')['Utility'];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const chance = require('chance').Chance();
const fs = require('fs');
const _ = require('lodash');

describe('POST /videos/:id/upload', function() {
    let video, server, authorization, videoFile = path.resolve(__dirname, '..', '..', 'fixtures', '1080x720.mov');

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        video = await results.db[k.Model.Video].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the video field is missing', function() {
            return request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should return 400 Bad Request if :id is not a number', function() {
            return request(server).post(`/videos/not_a_number/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile).expect(400);
        });

        it('should return 400 Bad Request if :id is 0', function() {
            return request(server).post(`/videos/0/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile).expect(400);
        });

        it('should return 404 Not Found if the :id does not correspond to an existing Video record', function() {
            return request(server).post(`/videos/${Math.pow(10, 5)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile).expect(404);
        });
    });

    describe('success', function() {
        before(function() {
            fs.mkdirSync(path.resolve(config.get(k.TempDir), 'videos'));
        });

        afterEach(function() {
            const files = fs.readdirSync(path.resolve(config.get(k.TempDir), 'videos'));
            _.each(files, function(file) {
                fs.unlinkSync(path.resolve(config.get(k.TempDir), 'videos', file));
            });
        });

        after(function() {
            fs.rmdirSync(path.resolve(config.get(k.TempDir), 'videos'));
        });

        it('should save a new video asset with the appropriate hash title to Google Cloud Storage', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile);

            const expectedHash = Utility.getHashForId(video.get(k.Attr.Id));
            const videoPath = path.resolve(config.get(k.TempDir), 'videos', expectedHash + '.' + config.get(k.VideoFileExtension));

            assert(fs.existsSync(videoPath));
        });

        it('should save a new picture asset with the appropriate hash title to Google Cloud Storage', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile);

            const expectedHash = Utility.getHashForId(video.get(k.Attr.Id));
            const imagePath = path.resolve(config.get(k.TempDir), 'videos', expectedHash + '.' + config.get(k.ImageFileExtension));

            assert(fs.existsSync(imagePath));
        });

        it('should set the "length" of the video to the video duration in seconds', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile);
            await video.reload();
            assert.equal(video[k.Attr.Length], 3);
        });

        it("should set the video record 'video_url' to the video url", async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile);

            await video.reload();

            const actualUrl = video.get(k.Attr.VideoUrl);
            const videoIdHash = Utility.getHashForId(video.get(k.Attr.Id));
            const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/videos/${videoIdHash}.${config.get(k.VideoFileExtension)}`;

            assert.equal(actualUrl, expectedUrl);
        });

        it("should set the video record 'picture_url' to the picture url", async function() {
            this.timeout(SpecUtil.defaultTimeout);
            await request(server).post(`/videos/${video.get(k.Attr.Id)}/upload`).set(k.Header.Authorization, authorization).attach('video', videoFile);

            await video.reload();

            const actualUrl = video.get(k.Attr.PictureUrl);
            const videoIdHash = Utility.getHashForId(_.toNumber(video.get(k.Attr.Id)));
            const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/videos/${videoIdHash}.${config.get(k.ImageFileExtension)}`;

            assert.equal(actualUrl, expectedUrl);
        });
    });
});
