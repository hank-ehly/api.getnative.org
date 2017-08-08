/**
 * show.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/14.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('GET /collocation_occurrences/:id', function() {
    let authorization = null;
    let collocation = null;
    let server = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        server = results.server;
        authorization = results.authorization;
        db = results.db;
        collocation = await db[k.Model.CollocationOccurrence].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the video_id parameter value is 0', function() {
            return request(server).get(`/collocation_occurrences/0`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should return 400 Bad Request if the video_id parameter value is not a number', function() {
            return request(server).get(`/collocation_occurrences/not_a_number`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should return 404 Bad Request if the video_id parameter value does not correlate to an existing video record', function() {
            return request(server).get(`/collocation_occurrences/${Math.pow(10, 6)}`).set(k.Header.Authorization, authorization).expect(404);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a valid request', function() {
            return request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).expect(200);
        });

        it('should contain an "id" number', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should contain a "text" string', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isString(response.body[k.Attr.Text]));
        });

        it('should contain an "ipa_spelling" string', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isString(response.body[k.Attr.IPASpelling]));
        });

        it('should contain a "usage_examples" object', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(response.body.usage_examples));
        });

        it('should contain a "usage_examples.records" array', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isArray(response.body.usage_examples.records));
        });

        it('should contain a "usage_examples.count" number', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.usage_examples.count));
        });

        it('should set the "usage_examples.count" to the length of the "usage_examples.records" array', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert.equal(response.body.usage_examples.count, response.body.usage_examples.records.length);
        });

        it('should contain a "usage_examples.records[N].id" number', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isNumber(_.first(response.body.usage_examples.records)[k.Attr.Id]));
        });

        it('should contain a "usage_examples.records[N].text" string', async function() {
            const response = await request(server).get(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.usage_examples.records)[k.Attr.Text]));
        });
    });
});
