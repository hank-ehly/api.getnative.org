/**
 * dequeue.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/28.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('POST /videos/:id/dequeue', function() {
    let authorization = null;
    let sampleVideo   = null;
    let server        = null;
    let user          = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login();
        authorization = result.authorization;
        user = result.response.body;
        server = result.server;
        db = result.db;

        const values = await db.sequelize.query(`
            SELECT * FROM videos WHERE id NOT IN (
                SELECT video_id FROM cued_videos WHERE user_id = ?
            ) LIMIT 1;
        `, {replacements: [user[k.Attr.Id]]});

        const [video] = values;
        const nonQueuedVideo = _.first(video);

        const queuedVideo = await db[k.Model.CuedVideo].create({
            user_id: user[k.Attr.Id],
            video_id: nonQueuedVideo[k.Attr.Id]
        });

        sampleVideo = await db[k.Model.Video].findByPrimary(queuedVideo[k.Attr.VideoId]);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('success', function() {
        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).set('authorization', authorization).expect(204, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).set('authorization', authorization).then(function(response) {
                assert.equal(_.size(response.body), 0);
            });
        });

        it(`should remove the video from the queue (by destroying the appropriate queued video record)`, function() {
            return request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).set('authorization', authorization).then(function(response) {
                return db[k.Model.CuedVideo].find({
                    where: {
                        user_id: user[k.Attr.Id],
                        video_id: sampleVideo[k.Attr.Id]
                    }
                });
            }).then(function(dequeuedVideo) {
                assert(!dequeuedVideo);
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post(`/videos/${sampleVideo[k.Attr.Id]}/dequeue`).expect(401, done);
        });

        it(`should respond with 400 Bad Request if the 'id' parameter is not a number`, function(done) {
            request(server).post(`/videos/not_a_number/dequeue`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'id' parameter is a negative number`, function(done) {
            request(server).post(`/videos/-50/dequeue`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'id' parameter is 0`, function(done) {
            request(server).post(`/videos/0/dequeue`).set('authorization', authorization).expect(400, done);
        });
    });
});
