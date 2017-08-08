/**
 * index.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/04.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('GET /genders', function() {
    let authorization = null;
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
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a valid request', function(done) {
            request(server).get('/genders').set(k.Header.Authorization, authorization).expect(200, done);
        });

        it('should return an object with a top level "count" number', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.count));
        });

        it('should return an object with a top level "records" array', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(_.isArray(response.body.records));
        });

        it('should set the "count" to the length of the "records" array', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert.equal(response.body.count, response.body.records.length);
        });

        it('should contain a "records[N].id" number', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(_.isNumber(_.first(response.body.records)[k.Attr.Id]));
        });

        it('should contain a "records[N].name" string', async function() {
            const response = await request(server).get('/genders').set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Name]));
        });
    });
});
