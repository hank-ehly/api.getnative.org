/**
 * like.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/24.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('POST /videos/:id/like', function() {
    let server         = null;
    let authorization  = null;
    let requestVideoId = null;
    let db             = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login();
        authorization = result.authorization;
        server = result.server;
        db = result.db;
        const values = await db.sequelize.query(`
            SELECT id FROM videos WHERE id NOT IN (
                SELECT video_id FROM likes WHERE user_id = ?
            ) LIMIT 1
        `, {replacements: [result.response.body[k.Attr.Id]]});
        const [r] = values;
        requestVideoId = _.first(r)[k.Attr.Id]
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(`/videos/${requestVideoId}/like`).set('authorization', authorization).then(function(response) {
                assert(response.header[k.Header.AuthToken].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/videos/${requestVideoId}/like`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post(`/videos/${requestVideoId}/like`).expect(401, done);
        });

        it(`should return 404 Not Found if the specified video is not found`, function(done) {
            request(server).post('/videos/999999999/like').set('authorization', authorization).expect(404, done);
        });

        it(`should return 400 Bad Request if the required :id is not a number`, function(done) {
            request(server).post('/videos/x/like').set('authorization', authorization).expect(400, done);
        });

        it(`should return 400 Bad Request if the required :id is 0`, function(done) {
            request(server).post(`/videos/0/like`).set('authorization', authorization).expect(400, done);
        });
    });

    describe('success', function() {
        it(`should respond with 204 No Content if the request succeeds`, function(done) {
            request(server).post(`/videos/${requestVideoId}/like`).set('authorization', authorization).expect(204, done);
        });

        it(`should increment the video's 'like_count' by 1`, function() {
            // get current like_count
            return db.sequelize.query(`SELECT COUNT(*) AS like_count FROM likes WHERE video_id = ${requestVideoId}`).then(r => {
                const beforeLikeCount = parseInt(r[0][0].like_count);

                // perform request
                return request(server).post(`/videos/${requestVideoId}/like`).set('authorization', authorization).then(() => {

                    // get incremented like_count
                    return db.sequelize.query(`SELECT COUNT(*) AS like_count FROM likes WHERE video_id = ${requestVideoId}`).then(r => {
                        const afterLikeCount = parseInt(r[0][0].like_count);

                        assert.equal(afterLikeCount, beforeLikeCount + 1);
                    });
                });
            });
        });
    });
});
