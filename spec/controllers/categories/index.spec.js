/**
 * index
 * get-native.com
 *
 * Created by henryehly on 2017/03/02.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('GET /categories', function() {
    let server = null;
    let authorization = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login();
        server = results.server;
        authorization = results.authorization;
        db = results.db;
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/categories').expect(401, done);
        });

        it('should respond with 400 Bad Request if the provided lang query parameter is not a valid language code', function(done) {
            request(server).get('/categories').query({lang: 'foobar'}).set('authorization', authorization).expect(400, done);
        });
    });

    describe('response.success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(response.header[k.Header.AuthToken].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should return a 200 response for a valid request', function(done) {
            request(server).get('/categories').set('authorization', authorization).expect(200, done);
        });

        it(`should include the category 'id'`, function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        it(`should include the category 'name' string`, function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).name));
            });
        });

        it(`should include the subcategory 'id'`, function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(_.first(response.body.records).subcategories.records).id))
            });
        });

        it(`should include the subcategory 'name' string`, function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(_.first(response.body.records).subcategories.records).name));
            });
        });

        it('should respond with an object containing a top-level \'count\' property of integer type', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it('should respond with an object containing a top-level \'records\' property of array type', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.records.length));
            });
        });

        it('should respond with an object containing a sub-level \'subcategories\' property for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.records).subcategories));
            });
        });

        it('should respond with an object containing a sub-level \'count\' property of integer type for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).subcategories.count));
            });
        });

        it('should respond with an object containing a sub-level \'records\' property of array type for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).subcategories.records.length));
            });
        });

        it('should return more than 0 subcategories', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(_.gt(_.first(response.body.records).subcategories.records.length, 0));
            });
        });

        it('should set the count integer value to the number of top-level records', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                let count = response.body.count;
                let recordsLength = response.body.records.length;
                assert(count === recordsLength);
            });
        });

        it('should set the count integer value for a topic to the number of subcategories included in the category', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                let count = _.first(response.body.records).subcategories.count;
                let recordsLength = _.first(response.body.records).subcategories.records.length;
                assert.equal(count, recordsLength);
            });
        });

        it('should return a category even if it has no subcategories', async function() {
            const categories = await db[k.Model.Category].findAll({attributes: [k.Attr.Id]});

            await db[k.Model.Subcategory].update({
                category_id: _.nth(categories, 4).get(k.Attr.Id)
            }, {
                where: {category_id: _.nth(categories, 3).get(k.Attr.Id)}
            });

            const response = await request(server).get('/categories').set('authorization', authorization);

            assert.equal(response.body.count, categories.length);
        });

        it('should localize category names based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/categories').query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize category names based on the user.interface_language if no lang parameter is present', async function() {
            const response = await request(server).get('/categories').set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize subcategory names based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/categories').query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(_.first(response.body.records).subcategories.records)[k.Attr.Name]));
        });

        it('should localize subcategory names based on the user.interface_language if no lang parameter is present', async function() {
            const response = await request(server).get('/categories').set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(_.first(response.body.records).subcategories.records)[k.Attr.Name]));
        });
    });
});
