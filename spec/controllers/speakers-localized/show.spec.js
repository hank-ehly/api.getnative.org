/**
 * show.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/04.
 */

const Speaker = require('../../../app/models')['Speaker'];
const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const url = require('url');
const _ = require('lodash');

describe('GET /speakers/:id/speakers_localized', function() {
    let authorization = null;
    let speaker = null;
    let server = null;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
        speaker = await Speaker.find();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login(true);
        server = result.server;
        authorization = result.authorization;
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the provided "id" is not an integer', function() {
            return request(server).get(`/speakers/not_an_integer/speakers_localized`).set('authorization', authorization).expect(400);
        });

        it('should return 400 Bad Request if the provided "id" is 0', function() {
            return request(server).get(`/speakers/0/speakers_localized`).set('authorization', authorization).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 200 OK for a successful request', function() {
            return request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization).expect(200);
        });

        it('should return a "records" array', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isArray(response.body.records));
        });

        it('should return a "count" integer', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isNumber(response.body.count));
        });

        it('should set the "count" integer to the length of "records"', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert.equal(response.body.records.length, response.body.count);
        });

        it('should return a "records[N].id" integer', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records)[k.Attr.Id]));
        });

        it('should return a "records[N].description" string', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Description]));
        });

        it('should return a "records[N].name" sting', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should return a "records[N].location" sting', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isString(_.first(response.body.records)[k.Attr.Location]));
        });

        it('should return a "records[N].language" object', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isPlainObject(_.first(response.body.records).language));
        });

        it('should return a "records[N].language.id" integer', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isNumber(_.first(response.body.records).language[k.Attr.Id]));
        });

        it('should return a "records[N].language.name" string', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isString(_.first(response.body.records).language[k.Attr.Name]));
        });

        it('should return a "records[N].language.code" string', async function() {
            const response = await request(server).get(`/speakers/${speaker.get(k.Attr.Id)}/speakers_localized`).set('authorization', authorization);
            assert(_.isString(_.first(response.body.records).language[k.Attr.Code]));
        });

        it('should return an empty "records" array if the given ID does not correspond to an existing Speaker record', async function() {
            const response = await request(server).get(`/speakers/${Math.pow(10, 5)}/speakers_localized`).set('authorization', authorization);
            assert(_.isEqual(response.body.records, []));
        });

        it('should return a count of 0 if the given ID does not correspond to an existing Speaker record', async function() {
            const response = await request(server).get(`/speakers/${Math.pow(10, 5)}/speakers_localized`).set('authorization', authorization);
            assert.equal(response.body.count, 0);
        });
    });
});
