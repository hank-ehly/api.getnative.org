/**
 * delete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/20.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('DELETE /categories/:category_id/subcategories/:subcategory_id', function() {
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
        const randomCategory = await db[k.Model.Category].find({attributes: [k.Attr.Id]});
        const deletableSubcategory = await db[k.Model.Subcategory].create({category_id: randomCategory.get(k.Attr.Id)});
        subcategoryId = deletableSubcategory.get(k.Attr.Id);
        categoryId = deletableSubcategory.get('category_id');
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Response if :category_id is not a number', function(done) {
            request(server)
                .delete(`/categories/not_a_number/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should return 400 Bad Response if :category_id is 0', function(done) {
            request(server)
                .delete(`/categories/0/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should return 404 Not Found if :category_id is not the id of an existing Category record', function(done) {
            request(server)
                .delete(`/categories/99999999/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .expect(404, done);
        });

        it('should return 400 Bad Response if :subcategory_id is not a number', function(done) {
            request(server)
                .delete(`/categories/${categoryId}/subcategories/not_a_number`)
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should return 400 Bad Response if :subcategory_id is 0', function(done) {
            request(server)
                .delete(`/categories/${categoryId}/subcategories/0`)
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should return 404 Not Found if :subcategory_id is not the id of an existing Subcategory record', function(done) {
            request(server)
                .delete(`/categories/${categoryId}/subcategories/99999999`)
                .set(k.Header.Authorization, authorization)
                .expect(404, done);
        });

        it('should return 422 Unprocessable Entity if the Subcategory has dependent resources', async function() {
            const video = await db[k.Model.Video].find({attributes: [k.Attr.Id, 'subcategory_id']});
            const subcategory = await db[k.Model.Subcategory].findByPrimary(video.get('subcategory_id'));
            return request(server)
                .delete(`/categories/${subcategory.get('category_id')}/subcategories/${subcategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization)
                .expect(422);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);

            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);

            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function(done) {
            request(server)
                .delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization)
                .expect(204, done);
        });

        it('should delete the specified Subcategory record', async function() {
            await request(server)
                .delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
                .set(k.Header.Authorization, authorization);

            const deletedSubcategory = await db[k.Model.Category].findByPrimary(subcategoryId);
            assert(_.isNull(deletedSubcategory));
        });

        it('should delete the SubcategoryLocalized records associated to the Subcategory', async function() {
            const randomCategory = await db[k.Model.Category].find({attributes: [k.Attr.Id]});
            const newSubcategory = await db[k.Model.Subcategory].create({category_id: randomCategory.get(k.Attr.Id)});

            const localizedSubcategoryPromises = [];
            const languages = await db[k.Model.Language].findAll();
            for (let lang of languages) {
                let promise = db[k.Model.SubcategoryLocalized].create({
                    subcategory_id: newSubcategory.get(k.Attr.Id),
                    language_id: lang.get(k.Attr.Id),
                    name: 'test-' + lang.get(k.Attr.Code)
                });
                localizedSubcategoryPromises.push(promise);
            }

            await Promise.all(localizedSubcategoryPromises);

            const subcategory = await db[k.Model.Subcategory].findByPrimary(newSubcategory.get(k.Attr.Id), {
                attributes: [k.Attr.Id, 'category_id'],
                include: {
                    model: db[k.Model.SubcategoryLocalized],
                    attributes: [k.Attr.Id],
                    as: 'subcategories_localized'
                }
            });

            await request(server)
                .delete(`/categories/${subcategory.get('category_id')}/subcategories/${subcategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization);

            const deletedSubcategoriesLocalized = await db[k.Model.SubcategoryLocalized].findAll({
                where: {
                    id: {
                        $in: _.invokeMap(subcategory.subcategories_localized, 'get', k.Attr.Id)
                    }
                }
            });

            assert.equal(deletedSubcategoriesLocalized.length, 0);
        });
    });
});
