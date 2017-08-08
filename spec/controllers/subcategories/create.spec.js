/**
 * create.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/20.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services')['Auth'];
const config = require('../../../config/application').config;

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /categories/:id/subcategories', function() {
    let authorization = null;
    let categoryId = null;
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
        categoryId = (await db[k.Model.Category].find({attributes: [k.Attr.Id]})).get(k.Attr.Id);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the provided :id is not a number', function(done) {
            request(server).post('/categories/not_a_number/subcategories').set(k.Header.Authorization, authorization).expect(400, done);
        });

        it('should return 404 Not Found if the provided :id is not an existing category id', function(done) {
            request(server).post('/categories/999999999/subcategories').set(k.Header.Authorization, authorization).expect(404, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .post(`/categories/${categoryId}/subcategories`)
                .set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .post(`/categories/${categoryId}/subcategories`)
                .set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 201 Created for a valid request', function(done) {
            const response = request(server)
                .post(`/categories/${categoryId}/subcategories`)
                .set(k.Header.Authorization, authorization)
                .expect(201, done);
        });

        it('should create a new Subcategory record', async function() {
            const beforeCount = await db[k.Model.Subcategory].count();
            await request(server).post(`/categories/${categoryId}/subcategories`).set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.Subcategory].count();
            assert.equal(afterCount, beforeCount + 1);
        });

        it('should create a new SubcategoryLocalized record for each language', async function() {
            const beforeCount = await db[k.Model.SubcategoryLocalized].count();
            await request(server).post(`/categories/${categoryId}/subcategories`).set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.SubcategoryLocalized].count();
            assert.equal(afterCount, beforeCount + _.size(config.get(k.VideoLanguageCodes)));
        });

        it('should return a top level "id" number', async function() {
            const response = await request(server)
                .post(`/categories/${categoryId}/subcategories`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should return a top level "category_id" number', async function() {
            const response = await request(server)
                .post(`/categories/${categoryId}/subcategories`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });
    });
});
