/**
 * index.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/21.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('GET /languages', function() {
    let server = null;
    let authorization = null;
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
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get('/languages').set('authorization', authorization).then(function(response) {
                assert(response.header[k.Header.AuthToken].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/languages').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should return a 200 response for a valid request', function(done) {
            request(server).get('/languages').set('authorization', authorization).expect(200, done);
        });

        it('should have a top-level "records" array', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert(_.isArray(response.body.records));
        });

        it('should have a top-level "count" number', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert(_.isNumber(response.body.count));
        });

        it('should set "count" and "records.length" to the same number value', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert.equal(response.body.records.length, response.body.count);
        });

        it('should have a "records[N].id" number', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records)[k.Attr.Id]));
        });

        it('should have a "records[N].code" string', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Code]));
        });

        it('should have a "records[N].name" string', async function() {
            const response = await request(server).get('/languages').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Name]));
        });
    });
});
