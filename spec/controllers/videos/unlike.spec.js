/**
 * unlike.spec
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

describe('POST /videos/:id/unlike', function() {
    let requestVideoId, authorization, server, user, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login();

        authorization = result.authorization;
        server = result.server;
        user = result.response.body;
        db = result.db;

        const query = `
            SELECT video_id 
            FROM likes
            LEFT JOIN users ON likes.user_id = users.id
            WHERE users.email = ?
            LIMIT 1
        `;

        const values = await db.sequelize.query(query, {replacements: [SpecUtil.credentials.email]});
        const [rows] = values;
        requestVideoId = _.first(rows)[k.Attr.VideoId];
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
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

    describe('success', function() {
        it('should respond with 204 No Content if the request succeeds', function(done) {
            request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization).expect(204, done);
        });

        it('should return 404 Not Found if the specified video is not found', function(done) {
            request(server).post('/videos/999999999/unlike').set('authorization', authorization).expect(404, done);
        });

        it('should decrement the video like count by 1', async function() {
            await db[k.Model.Like].create({
                video_id: requestVideoId,
                user_id: user[k.Attr.Id]
            });

            const beforeLikeCount = await db[k.Model.Like].count({where: {video_id: requestVideoId}});
            await request(server).post(`/videos/${requestVideoId}/unlike`).set('authorization', authorization);
            const afterLikeCount = await db[k.Model.Like].count({where: {video_id: requestVideoId}});
            assert.equal(afterLikeCount, beforeLikeCount - 1);
        });
    });
});
