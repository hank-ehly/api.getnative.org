/**
 * dequeue.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/28.
 */

const SpecUtil = require('../../spec-util');

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('POST /videos/:id/dequeue', function() {
    let authorization = null;
    let sampleVideo   = null;
    let account       = null;
    let server        = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initGroup) {
            authorization = initGroup.authorization;
            account       = initGroup.response.body;
            server        = initGroup.server;
            db            = initGroup.db;

            return db.sequelize.query(`
                SELECT * FROM videos WHERE id NOT IN (
                    SELECT video_id FROM cued_videos WHERE account_id = ?
                ) LIMIT 1;
            `, {replacements: [account.id]}).spread(function(video) {
                return _.first(video);
            }).then(function(nonQueuedVideo) {
                return db.CuedVideo.create({
                    account_id: account.id,
                    video_id: nonQueuedVideo.id
                });
            }).then(function(queuedVideo) {
                return db.Video.findById(queuedVideo.video_id);
            }).then(function(video) {
                sampleVideo = video;
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(`/videos/${sampleVideo.id}/dequeue`).set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header['x-gn-auth-token'].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/videos/${sampleVideo.id}/dequeue`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.success', function() {
        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).post(`/videos/${sampleVideo.id}/dequeue`).set('authorization', authorization).expect(204, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).post(`/videos/${sampleVideo.id}/dequeue`).set('authorization', authorization).then(function(response) {
                assert.equal(_.size(response.body), 0);
            });
        });

        it(`should remove the video from the queue (by destroying the appropriate queued video record)`, function() {
            return request(server).post(`/videos/${sampleVideo.id}/dequeue`).set('authorization', authorization).then(function(response) {
                return db.CuedVideo.findOne({
                    where: {
                        account_id: account.id,
                        video_id: sampleVideo.id
                    }
                });
            }).then(function(dequeuedVideo) {
                assert(!dequeuedVideo);
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post(`/videos/${sampleVideo.id}/dequeue`).expect(401, done);
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
