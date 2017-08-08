/**
 * delete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/19.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('DELETE /categories/:id', function() {
    let childlessCategory = null;
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
        childlessCategory = await db[k.Model.Category].create();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the :id parameter is not a number', function(done) {
            request(server)
                .delete('/categories/not_a_number')
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 400 Bad Request if the :id parameter is 0', function(done) {
            request(server)
                .delete('/categories/0')
                .set(k.Header.Authorization, authorization)
                .expect(400, done);
        });

        it('should respond with 404 Not Found if no Category for the provided :id exists', function(done) {
            request(server)
                .delete('/categories/999999')
                .set(k.Header.Authorization, authorization)
                .expect(404, done);
        });

        it('should respond with 422 Unprocessable Entity if the Category has Subcategory records associated to it', async function() {
            const randomSubcategory = await db[k.Model.Subcategory].find({attributes: [k.Attr.Id, 'category_id']});
            const categoryWithChildren = await db[k.Model.Category].find({
                where: {id: randomSubcategory.get('category_id')},
                attributes: [k.Attr.Id]
            });

            await request(server)
                .delete(`/categories/${categoryWithChildren.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization)
                .expect(422);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .delete(`/categories/${childlessCategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization);

            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .delete(`/categories/${childlessCategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization);

            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function(done) {
            request(server)
                .delete(`/categories/${childlessCategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization)
                .expect(204, done);
        });

        it('should delete the specified Category record', async function() {
            await request(server)
                .delete(`/categories/${childlessCategory.get(k.Attr.Id)}`)
                .set(k.Header.Authorization, authorization);

            const deletedCategory = await db[k.Model.Category].find({
                where: {
                    id: childlessCategory.get(k.Attr.Id)
                }
            });

            assert(_.isNull(deletedCategory));
        });

        it('should delete the CategoryLocalized records associated to the Category', async function() {
            const randomCategoryLocalized = await db[k.Model.CategoryLocalized].find({
                attributes: [k.Attr.Id, 'category_id']
            });

            const categoryWithLocalizations = await db[k.Model.Category].findByPrimary(randomCategoryLocalized.get('category_id'), {
                attributes: [k.Attr.Id],
                include: {
                    model: db[k.Model.CategoryLocalized],
                    attributes: [k.Attr.Id],
                    as: 'categories_localized'
                }
            });

            const otherCategory = await db[k.Model.Category].find({
                where: {
                    id: {
                        $not: categoryWithLocalizations.get(k.Attr.Id)
                    }
                },
                attributes: [k.Attr.Id]
            });

            await db[k.Model.Subcategory].update({
                category_id: otherCategory.get(k.Attr.Id)
            }, {
                where: {
                    category_id: categoryWithLocalizations.get(k.Attr.Id)
                }
            });

            await request(server).delete(`/categories/${categoryWithLocalizations.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);

            const deletedCategory = await db[k.Model.Category].findByPrimary(categoryWithLocalizations.get(k.Attr.Id));
            const deletedCategoriesLocalized = await db[k.Model.CategoryLocalized].findAll({
                where: {
                    id: {
                        $in: _.invokeMap(categoryWithLocalizations.categories_localized, 'get', k.Attr.Id)
                    }
                }
            });

            assert(_.isNull(deletedCategory));
            assert.equal(deletedCategoriesLocalized.length, 0);
        });
    });
});
