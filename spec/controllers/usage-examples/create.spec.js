/**
 * create.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/14.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services/auth');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /collocation_occurrences/:id/usage_examples', function() {
    let authorization, collocation, server, db, validBody = {text: ''};

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
        validBody.text = Auth.generateRandomHash();
        collocation = await db[k.Model.CollocationOccurrence].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).send(validBody).expect(401);
        });

        it('should respond with 400 Bad Request if the :id parameter is not a number', function() {
            return request(server).post(`/collocation_occurrences/not_a_number/usage_examples`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 400 Bad Request if the :id parameter is 0', function() {
            return request(server).post(`/collocation_occurrences/0/usage_examples`).set(k.Header.Authorization, authorization).send(validBody).expect(400);
        });

        it('should respond with 404 Not Found if no UsageExample record for the provided :id exists', function() {
            return request(server).post(`/collocation_occurrences/${Math.pow(10, 6)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody).expect(404);
        });

        it('should respond with 400 Bad Request if the "text" parameter is missing', function() {
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send({}).expect(400);
        });

        it('should respond with 400 Bad Request if the "text" parameter is not a string', function() {
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send({text: _.stubObject()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "text" parameter is an empty string', function() {
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send({text: _.stubString()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "text" parameter is longer than 200 chars', function() {
            const longString = _.times(201, _.constant('x')).join('');
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send({text: longString}).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);
            assert(response.header[k.Header.AuthToken].length > 0);
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 201 Created in a successful response', function() {
            return request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody).expect(201);
        });

        it('should contain an "id" number', async function() {
            const response = await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should contain a "text" string', async function() {
            const response = await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);
            assert(_.isString(response.body[k.Attr.Text]));
        });

        it('should contain a "collocation_occurrence_id" number', async function() {
            const response = await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);
            assert(_.isNumber(response.body[k.Attr.CollocationOccurrenceId]));
        });

        it('should create a new UsageExample record with the correct text', async function() {
            await request(server).post(`/collocation_occurrences/${collocation.get(k.Attr.Id)}/usage_examples`).set(k.Header.Authorization, authorization).send(validBody);

            const maxUsageExampleId = await db[k.Model.UsageExample].max(k.Attr.Id);
            const latestUsageExample = await db[k.Model.UsageExample].findByPrimary(maxUsageExampleId);

            assert.equal(latestUsageExample.get(k.Attr.Text), validBody.text);
        });
    });
});
