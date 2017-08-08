/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/13.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services/auth');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /usage_examples/:id', function() {
    let usageExample = null;
    let authorization = null;
    let server = null;
    let db = null;
    const validBody = {text: ''};

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;
        usageExample = await db[k.Model.UsageExample].find();
        validBody.text = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).send(validBody).expect(401);
        });

        it('should respond with 400 Bad Request if the :id parameter is not a number', function() {
            return request(server).patch(`/usage_examples/not_a_number`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 400 Bad Request if the :id parameter is 0', function() {
            return request(server).patch(`/usage_examples/0`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 404 Not Found if no UsageExample record for the provided :id exists', function() {
            return request(server).patch(`/usage_examples/${Math.pow(10, 6)}`).set(k.Header.Authorization, authorization).send(validBody).expect(404);
        });

        it('should respond with 400 Bad Request if the "text" parameter is not a string', function() {
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({text: _.stubObject()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "text" parameter is an empty string', function() {
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({text: _.stubString()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "text" parameter is longer than 200 chars', function() {
            const longString = _.times(201, _.constant('x')).join('');
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({text: longString}).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            assert(response.header[k.Header.AuthToken].length > 0);
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return a 204 response for a valid request', function() {
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody).expect(204);
        });

        it('should respond with 304 if the request body is empty', function() {
            return request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({}).expect(304);
        });

        it('should update the "text" property of the UsageExample record', async function() {
            await request(server).patch(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            const example = await db[k.Model.UsageExample].find({where: {text: validBody.text}});
            assert(example);
        });
    });
});
