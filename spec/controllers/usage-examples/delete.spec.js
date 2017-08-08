/**
 * delete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/15.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('DELETE /usage_examples/:id', function() {
    let authorization, server, db, usageExample;

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
        usageExample = await db[k.Model.UsageExample].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the :id parameter is not a number', function() {
            return request(server).delete('/usage_examples/not_a_number').set(k.Header.Authorization, authorization).expect(400);
        });

        it('should respond with 400 Bad Request if the :id parameter is 0', function() {
            return request(server).delete('/usage_examples/0').set(k.Header.Authorization, authorization).expect(400);
        });

        it('should respond with 404 Not Found if no UsageExample for the provided :id exists', function() {
            return request(server).delete('/usage_examples/999999').set(k.Header.Authorization, authorization).expect(404);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).delete(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).delete(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function() {
            return request(server).delete(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).expect(204);
        });

        it('should delete the specified UsageExample record', async function() {
            await request(server).delete(`/usage_examples/${usageExample.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);

            const deletedUsageExample = await db[k.Model.Category].find({
                where: {
                    id: usageExample.get(k.Attr.Id)
                }
            });

            assert(_.isNull(deletedUsageExample));
        });
    });
});
