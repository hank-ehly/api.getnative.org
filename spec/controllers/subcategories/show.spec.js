/**
 * show.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/05.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('GET /categories/:category_id/subcategories/:subcategory_id', function() {
    let authorization = null;
    let subcategoryId = null;
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
        categoryId = (await db[k.Model.Category].find()).get(k.Attr.Id);
        subcategoryId = (await db[k.Model.Subcategory].find({where: {category_id: categoryId}})).get(k.Attr.Id);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the :category_id parameter is not a number', function(done) {
            request(server).get('/categories/not_a_number/subcategories/' + subcategoryId).set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the :category_id parameter is 0', function(done) {
            request(server).get('/categories/0/subcategories/' + subcategoryId).set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 404 Not Found if no Category for the provided :category_id exists', function(done) {
            request(server).get('/categories/99999/subcategories/' + subcategoryId).set(k.Header.Authorization, authorization)
                .expect(404, done);
        });

        it('should respond with 400 Bad Request if the :subcategory_id parameter is not a number', function(done) {
            request(server).get(`/categories/${categoryId}/subcategories/not_a_number`).set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the :subcategory_id parameter is 0', function(done) {
            request(server).get(`/categories/${categoryId}/subcategories/0`).set(k.Header.Authorization, authorization).expect(400, done);
        });

        it('should respond with 404 Not Found if no Subcategory for the provided :subcategory_id exists', function(done) {
            request(server).get(`/categories/${categoryId}/subcategories/99999`).set(k.Header.Authorization, authorization)
                .expect(404, done);
        });

        it('should respond with 404 Not Found if the Subcategory is not a child of the Category', function(done) {
            db[k.Model.Subcategory].find({
                where: {
                    category_id: {
                        $not: categoryId
                    }
                }
            }).then(function(subcategory) {
                request(server).get(`/categories/${categoryId}/subcategories/${subcategory.get(k.Attr.Id)}`)
                    .set(k.Header.Authorization, authorization).expect(404, done);
            });
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 200 OK for a valid request', function(done) {
            request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`).set(k.Header.Authorization, authorization)
                .expect(200, done);
        });

        it('should return the Subcategory whose id is equal to :subcategory_id', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            const subcategory = await db[k.Model.Subcategory].findByPrimary(subcategoryId);
            assert.equal(response.body[k.Attr.Id], subcategory.get(k.Attr.Id));
        });

        it('should return a top level "id" number', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should return a top level "category" object', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(response.body.category));
        });

        it('should return a "category.id" number', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.category[k.Attr.Id]));
        });

        it('should return a top level "subcategories_localized" object', async function() {
                const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                    .set(k.Header.Authorization, authorization);
                assert(_.isPlainObject(response.body.subcategories_localized));
        });

        it('should return a "subcategories_localized.records" array', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isArray(response.body.subcategories_localized.records));
        });

        it('should return a "subcategories_localized.count" number', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.subcategories_localized.count));
        });

        it('should return a "subcategories_localized.records[N].id" number', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isNumber(_.first(response.body.subcategories_localized.records)[k.Attr.Id]));
        });

        it('should return a "subcategories_localized.records[N].name" string', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.subcategories_localized.records)[k.Attr.Name]));
        });

        it('should return a "subcategories_localized.records[N].language" object', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(_.first(response.body.subcategories_localized.records).language));
        });

        it('should return a "subcategories_localized.records[N].language.code" string', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.subcategories_localized.records).language[k.Attr.Code]));
        });

        it('should return a "subcategories_localized.records[N].language.name" string', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.subcategories_localized.records).language[k.Attr.Name]));
        });

        it('should return a correctly formatted top level "created_at" string', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.CreatedAt]));
        });

        it('should return a correctly formatted top level "updated_at" string', async function() {
            const response = await request(server).get(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.UpdatedAt]));
        });
    });
});
