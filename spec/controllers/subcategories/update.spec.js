/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/05.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const Auth = require('../../../app/services')['Auth'];
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('PATCH /categories/:category_id/subcategories/:subcategory_id', function() {
    let newCategoryId = null;
    let subcategoryId = null;
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

        let subcategory = await db[k.Model.Subcategory].find({attributes: ['category_id', k.Attr.Id]});
        categoryId = subcategory.get('category_id');
        subcategoryId = subcategory.get(k.Attr.Id);
        newCategoryId = (await db[k.Model.Category].find({where: {id: {$not: categoryId}}})).get(k.Attr.Id);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the :category_id parameter is not a number', function(done) {
            request(server)
                .patch('/categories/hello/subcategories/' + subcategoryId)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the :category_id parameter is 0', function(done) {
            request(server)
                .patch('/categories/0/subcategories/' + subcategoryId)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(400, done);
        });

        it('should respond with 404 Not Found if no Category for the provided :category_id exists', function(done) {
            request(server)
                .patch('/categories/99999/subcategories/' + subcategoryId)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(404, done);
        });

        it('should respond with 400 Bad Request if the :subcategory_id parameter is not a number', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/hello`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the :subcategory_id parameter is 0', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/0`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId}).expect(400, done);
        });

        it('should respond with 404 Not Found if no Subcategory for the provided :subcategory_id exists', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/99999`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(404, done);
        });

        it('should respond with 400 Bad Request if the category_id body parameter is 0', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .send({category_id: 0})
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the category_id body parameter is not a number', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .send({category_id: _.stubString()})
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 404 Not Found if the Subcategory is not a child of the Category', function(done) {
            db[k.Model.Subcategory].find({
                where: {
                    category_id: {
                        $not: categoryId
                    }
                }
            }).then(function(subcategory) {
                request(server)
                    .patch(`/categories/${categoryId}/subcategories/${subcategory.get(k.Attr.Id)}`)
                    .set(k.Header.Authorization, authorization).send({category_id: newCategoryId}).expect(404, done);
            });
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .send({category_id: newCategoryId})
                .set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId});
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId})
                .expect(204, done);
        });

        it('should return 304 Not Modified if the request body is empty', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({})
                .expect(304, done);
        });

        it('should return 304 Not Modified if the request body only contains invalid keys', function(done) {
            request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({foo: _.stubString()})
                .expect(304, done);
        });

        it('should change the Category of the specified Subcategory', async function() {
            await request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId});

            const subcategory = await db[k.Model.Subcategory].findByPrimary(subcategoryId);
            assert.equal(subcategory.get('category_id'), newCategoryId);
        });

        it('should return a Location with the changed Category id', async function() {
            const response = await request(server)
                .patch(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .send({category_id: newCategoryId});

            assert.equal(response.header[k.Header.Location], `/categories/${newCategoryId}/subcategories/${subcategoryId}`);
        });
    });
});
