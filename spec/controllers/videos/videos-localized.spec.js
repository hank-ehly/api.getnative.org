/**
 * videos-localized.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/10.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('', function() {
    let authorization, server, video, user, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login(true);
        authorization = result.authorization;
        server = result.server;
        user = result.response.body;
        db = result.db;
        video = await db[k.Model.Video].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the provided "id" is not an integer', function() {
            return request(server).get(`/videos/not_an_integer/videos_localized`).set('authorization', authorization).expect(400);
        });

        it('should return 400 Bad Request if the provided "id" is 0', function() {
            return request(server).get(`/videos/0/videos_localized`).set('authorization', authorization).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a successful request', function() {
            return request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`).set('authorization', authorization).expect(200);
        });

        it('should return a "records" array', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isArray(response.body.records));
        });

        it('should return a "count" integer', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isNumber(response.body.count));
        });

        it('should set the "count" integer to the length of "records"', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert.equal(response.body.records.length, response.body.count);
        });

        it('should return a "records[N].id" integer', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records)[k.Attr.Id]));
        });

        it('should return a "records[N].description" string', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Description]));
        });

        it('should return a "records[N].language_id" integer', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records).language_id));
        });

        it('should return a "records[N].video_id" integer', async function() {
            const response = await request(server).get(`/videos/${video.get(k.Attr.Id)}/videos_localized`)
                .set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records).video_id));
        });

        it('should return an empty "records" array if the given ID does not correspond to an existing Video record', async function() {
            const response = await request(server).get(`/videos/${Math.pow(10, 5)}/videos_localized`).set('authorization', authorization);
            assert(_.isEqual(response.body.records, []));
        });

        it('should return a count of 0 if the given ID does not correspond to an existing Video record', async function() {
            const response = await request(server).get(`/videos/${Math.pow(10, 5)}/videos_localized`).set('authorization', authorization);
            assert.equal(response.body.count, 0);
        });
    });
});
