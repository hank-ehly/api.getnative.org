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
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('GET /speakers', function() {
    let authorization = null;
    let server = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login(true);
        authorization = result.authorization;
        server = result.server;
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).get('/speakers').expect(401);
        });

        it('should respond with 400 if the provided "lang" query parameter value is not a valid lang code', function() {
            return request(server).get('/speakers').query({lang: 'invalid'}).set('authorization', authorization).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a successful request', function() {
            return request(server).get('/speakers').set('authorization', authorization).expect(200);
        });

        it('should contain a "records" array', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isArray(response.body.records));
        });

        it('should contain a "count" integer', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isNumber(response.body.count));
        });

        it('should set "count" to the length of "records"', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert.equal(response.body.records.length, response.body.count);
        });

        it('should contain a "records[N].id" integer', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records)[k.Attr.Id]));
        });

        it('should contain a "records[N].description" string', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Description]));
        });

        it('should contain a "records[N].name" string', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should contain a "records[N].location" string', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Location]));
        });

        it('should contain a "records[N].picture_url" url string', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.PictureUrl]));
        });

        it('should contain a "records[N].is_silhouette_picture" boolean', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isBoolean(_.first(response.body.records)[k.Attr.IsSilhouettePicture]));
        });

        it('should contain a "records[N].gender" object', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isPlainObject(_.first(response.body.records)['gender']));
        });

        it('should contain a "records[N].gender.id" integer', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records)['gender'][k.Attr.Id]));
        });

        it('should contain a "records[N].gender.name" string', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)['gender'][k.Attr.Name]));
        });

        it('should localize the speaker description based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/speakers').query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Description]));
        });

        it('should localize the speaker description based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(response.body.records)[k.Attr.Description]));
        });

        it('should localize the speaker name based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/speakers').query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize the speaker name based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize the speaker location based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/speakers').query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Location]));
        });

        it('should localize the speaker location based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get('/speakers').set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(response.body.records)[k.Attr.Location]));
        });
    });
});
