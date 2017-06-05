/**
 * show.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/01.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('GET /categories/:id', function() {
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
            request(server).get(`/categories/hello`).set(k.Header.Authorization, authorization).expect(400, done);
        });

        it('should respond with 404 Not Found if no Category for the provided :id exists', function(done) {
            request(server).get('/categories/' + 99999).set(k.Header.Authorization, authorization).expect(404, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 200 OK for a valid request', function(done) {
            request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization).expect(200, done);
        });

        it('should return the Category whose id is equal to :id', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            const category = await db[k.Model.Category].findByPrimary(categoryId);
            assert.equal(response.body[k.Attr.Id], category.get(k.Attr.Id));
        });

        it('should return a top level "id" number', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should return a top level "name" string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isString(response.body[k.Attr.Name]));
        });

        it('should return a correctly formatted top level "created_at" string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.CreatedAt]));
        });

        it('should return a correctly formatted top level "updated_at" string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.UpdatedAt]));
        });

        it('should return a top level subcategories object', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(response.body.subcategories));
        });

        it('should return a subcategories.records array', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isArray(response.body.subcategories.records));
        });

        it('should return a subcategories.count number', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.subcategories.count));
        });

        it('should return the same number of subcategory records as specified in subcategories.count', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert.equal(response.body.subcategories.records.length, response.body.subcategories.count);
        });

        it('should return a subcategories.records[N].id number', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isNumber(_.first(response.body.subcategories.records)[k.Attr.Id]));
        });

        it('should return a subcategories.records[N].name string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.subcategories.records)[k.Attr.Name]));
        });

        it('should return a correctly formatted subcategories.records[N].created_at string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.subcategories.records)[k.Attr.CreatedAt]));
        });

        it('should return a correctly formatted subcategories.records[N].updated_at string', async function() {
            const response = await request(server).get('/categories/' + categoryId).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.subcategories.records)[k.Attr.UpdatedAt]));
        });
    });
});