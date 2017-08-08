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

describe('POST /collocation_occurrences/:id', function() {
    let collocation = null;
    let authorization = null;
    let server = null;
    let db = null;
    const validBody = {ipa_spelling: ''};

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
        collocation = await db[k.Model.CollocationOccurrence].find();
        validBody.ipa_spelling = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).send(validBody).expect(401);
        });

        it('should respond with 400 Bad Request if the :id parameter is not a number', function() {
            return request(server).patch(`/collocation_occurrences/not_a_number`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 400 Bad Request if the :id parameter is 0', function() {
            return request(server).patch(`/collocation_occurrences/0`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 404 Not Found if no CollocationOccurrence record for the provided :id exists', function() {
            return request(server).patch(`/collocation_occurrences/${Math.pow(10, 6)}`).set(k.Header.Authorization, authorization).send(validBody).expect(404);
        });

        it('should respond with 400 Bad Request if the "ipa_spelling" parameter is an empty string', function() {
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({ipa_spelling: _.stubString()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "ipa_spelling" parameter is not a string', function() {
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({ipa_spelling: _.stubObject()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "ipa_spelling" parameter is longer than 100 chars', function() {
            const longString = _.times(101, _.constant('x')).join('');
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({ipa_spelling: longString}).expect(400);
        });

        it('should respond with 304 if the request body is empty', function() {
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({}).expect(304);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            assert(response.header[k.Header.AuthToken].length > 0);
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return a 204 response for a valid request', function() {
            return request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody).expect(204);
        });

        it('should update the ipa_spelling property of the CollocationOccurrence record', async function() {
            await request(server).patch(`/collocation_occurrences/${collocation.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(validBody);
            const co = await db[k.Model.CollocationOccurrence].find({where: {ipa_spelling: validBody.ipa_spelling}});
            assert(co);
        });
    });
});
