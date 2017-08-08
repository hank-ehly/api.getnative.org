/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/12.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services')['Auth'];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('PATCH /categories/:category_id/categories_localized/:categories_localized_id', function() {
    let realCategoryLocalizedId = null;
    let realCategoryId = null;
    let randomHash = null;
    let authorization = null;
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

        const categoryLocalized = await db[k.Model.CategoryLocalized].find({attributes: ['category_id', k.Attr.Id]});
        realCategoryId = categoryLocalized.get('category_id');
        realCategoryLocalizedId = categoryLocalized.get(k.Attr.Id);
        randomHash = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the :category_id parameter is not a number', function(done) {
            request(server)
                .patch(`/categories/hello/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(400, done);
        });

        it('should return 404 Not Found if no Category for the provided :category_id exists', function(done) {
            request(server)
                .patch(`/categories/99999/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(404, done);
        });

        it('should return 400 Bad Request if the :categories_localized_id parameter is not a number', function(done) {
            request(server)
                .patch(`/categories/hello/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(400, done);
        });

        it('should return 404 Not Found if no CategoryLocalized record for the provided :categories_localized_id exists', function(done) {
            request(server)
                .patch('/categories/' + realCategoryId + '/categories_localized/99999')
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(404, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is not a string', function(done) {
            request(server)
                .patch('/categories/1/categories_localized/1')
                .set(k.Header.Authorization, authorization)
                .send({name: _.stubObject()})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is 0 length', function(done) {
            request(server)
                .patch('/categories/1/categories_localized/1')
                .set(k.Header.Authorization, authorization)
                .send({name: _.stubString()})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is over 50 characters long', function(done) {
            const longString = _.times(51, 'x').join('');
            request(server)
                .patch('/categories/1/categories_localized/1')
                .set(k.Header.Authorization, authorization)
                .send({name: longString})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "category_id" query parameter is 0', function(done) {
            request(server)
                .patch(`/categories/0/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "categories_localized_id" query parameter is 0', function(done) {
            request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/0`)
                .set(k.Header.Authorization, authorization)
                .send({name: 'test'})
                .expect(400, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash});
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash});
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content if the request succeeds', function(done) {
            request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(204, done);
        });

        it('should return 304 Not Modified if the body is empty', function(done) {
            request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({})
                .expect(304, done);
        });

        it('should return 304 Not Modified if the body only contains invalid keys', function(done) {
            request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({foo: 'bar'})
                .expect(304, done);
        });

        it('should update the name of the CategoryLocalized record', async function() {
            const name = 'NEW_NAME';

            await request(server)
                .patch(`/categories/${realCategoryId}/categories_localized/${realCategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: name});

            const categoryLocalized = await db[k.Model.CategoryLocalized].findByPrimary(realCategoryLocalizedId);

            assert.equal(categoryLocalized.get(k.Attr.Name), name);
        });
    });
});
