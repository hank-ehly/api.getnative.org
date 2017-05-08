/**
 * unlike.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/24.
 */

const request  = require('supertest');
const assert   = require('assert');
const SpecUtil = require('../../spec-util');
const Promise  = require('bluebird');
const _        = require('lodash');

describe('POST /videos/:id/unlike', function() {
    let server         = null;
    let authorization  = null;
    let user           = null;
    let requestVideoId = null;
    let db             = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initObjects) {
            authorization = initObjects.authorization;
            server        = initObjects.server;
            user          = initObjects.response.body;
            db            = initObjects.db;

            const query = `
                SELECT video_id 
                FROM likes 
                WHERE account_id = (
                    SELECT id 
                    FROM accounts 
                    WHERE email = ?
                ) LIMIT 1;
            `;

            return db.sequelize.query(query, {replacements: [SpecUtil.credentials.email]}).spread(function(rows) {
                requestVideoId = _.first(rows).video_id;
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should return 400 Bad Request if the required :id is not a number`, function(done) {
            request(server).post('/videos/x/unlike').set('authorization', authorization).expect(400, done);
        });

        it(`should return 400 Bad Request if the required :id is 0`, function(done) {
            request(server).post(`/videos/0/unlike`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post(`/videos/${requestVideoId}/unlike`).expect(401, done);
        });
    });

    describe('response.success', function() {
        it(`should respond with 204 No Content if the request succeeds`, function(done) {
            request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).expect(204, done);
        });

        it(`should return 404 Not Found if the specified video is not found`, function(done) {
            request(server).post('/videos/999999999/unlike').set('authorization', authorization).expect(404, done);
        });

        it(`should decrement the video's 'like_count' by 1`, function() {
            // get current like_count
            return db.sequelize.query(`SELECT COUNT(*) AS \`like_count\` FROM \`likes\` WHERE \`video_id\` = ${requestVideoId}`).then(function(r) {
                const beforeLikeCount = parseInt(r[0][0].like_count); // ex. 3

                // perform request
                return request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).then(function() {

                    // get decremented like_count
                    return db.sequelize.query(`SELECT COUNT(*) AS \`like_count\` FROM \`likes\` WHERE \`video_id\` = ${requestVideoId}`).then(function(r) {
                        const afterLikeCount = parseInt(r[0][0].like_count); // ex. 2

                        assert.equal(afterLikeCount, beforeLikeCount - 1);
                    });
                });
            });
        });
    });
});
