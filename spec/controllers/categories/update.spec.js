/**
 * update.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/02.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const Auth = require('../../../app/services')['Auth'];
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('PATCH /categories/:id', function() {
    let newCategoryName = null;
    let authorization = null;
    let categoryId = null;
    let server = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        server = results.server;
        authorization = results.authorization;
        db = results.db;
        categoryId = (await db[k.Model.Category].find()).get(k.Attr.Id);
        newCategoryName = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the :id parameter is not a number', function(done) {
            request(server).patch(`/categories/hello`).set(k.Header.Authorization, authorization).send({name: newCategoryName})
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the "name" body parameter is not a string', function(done) {
            request(server).patch(`/categories/hello`).set(k.Header.Authorization, authorization).send({name: {not: 'valid'}})
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the "name" string body parameter is 0 length', function(done) {
            request(server).patch(`/categories/hello`).set(k.Header.Authorization, authorization).send({name: ''}).expect(400, done);
        });

        it('should respond with 404 Not Found if no Category for the provided :id exists', function(done) {
            request(server).patch('/categories/' + 99999).set(k.Header.Authorization, authorization).send({name: newCategoryName})
                .expect(404, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).patch('/categories/' + categoryId).send({name: newCategoryName})
                .set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).patch('/categories/' + categoryId).set(k.Header.Authorization, authorization)
                .send({name: newCategoryName});
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function(done) {
            request(server).patch('/categories/' + categoryId).set(k.Header.Authorization, authorization).send({name: newCategoryName})
                .expect(204, done);
        });

        it('should return 304 Not Modified if the request body is empty', function(done) {
            request(server).patch('/categories/' + categoryId).set(k.Header.Authorization, authorization).send({}).expect(304, done);
        });

        it('should change the name of the specified Category', async function() {
            await request(server).patch('/categories/' + categoryId).set(k.Header.Authorization, authorization)
                .send({name: newCategoryName});
            const category = await db[k.Model.Category].findByPrimary(categoryId);
            assert.equal(category.get(k.Attr.Name), newCategoryName);
        });
    });
});
