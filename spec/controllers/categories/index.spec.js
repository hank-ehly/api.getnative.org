/**
 * index
 * api.getnativelearning.com
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
    let server, authorization, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
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

    describe('failure', function() {
        it('should respond with 400 Bad Request if the provided lang query parameter is not a valid language code', function(done) {
            request(server).get('/categories').query({lang: 'foobar'}).set(k.Header.Authorization, authorization).expect(400, done);
        });

        it('should return 400 Bad Request if the require_subcategories query param is not a boolean', function(done) {
            request(server).get('/categories').query({
                require_subcategories: _.stubString()
            }).set(k.Header.Authorization, authorization).expect(400, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header if authorized', function() {
            return request(server).get('/categories').set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should not respond with an X-GN-Auth-Token header if not authorized', function() {
            return request(server).get('/categories').then(function(response) {
                assert(!response.header[k.Header.AuthToken]);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value if authorized', function() {
            return request(server).get('/categories').set(k.Header.Authorization, authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should return a 200 response for a valid request if authorized', function(done) {
            request(server).get('/categories').set(k.Header.Authorization, authorization).expect(200, done);
        });

        it('should return a 200 response for a valid request if not authorized', function(done) {
            request(server).get('/categories').expect(200, done);
        });

        it(`should include the category 'id'`, function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        it(`should include the category 'name' string`, function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isString(_.first(response.body.records).name));
            });
        });

        it(`should include the subcategory 'id'`, function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(_.first(_.first(response.body.records).subcategories.records).id))
            });
        });

        it(`should include the subcategory 'name' string`, function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isString(_.first(_.first(response.body.records).subcategories.records).name));
            });
        });

        it('should respond with an object containing a top-level \'count\' property of integer type', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it('should respond with an object containing a top-level \'records\' property of array type', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(response.body.records.length));
            });
        });

        it('should respond with an object containing a sub-level \'subcategories\' property for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isPlainObject(_.first(response.body.records).subcategories));
            });
        });

        it('should respond with an object containing a sub-level \'count\' property of integer type for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(_.first(response.body.records).subcategories.count));
            });
        });

        it('should respond with an object containing a sub-level \'records\' property of array type for the first object in the top-level \'records\' array', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.isNumber(_.first(response.body.records).subcategories.records.length));
            });
        });

        it('should return more than 0 subcategories', function() {
            return request(server).get('/categories').then(function(response) {
                assert(_.gt(_.first(response.body.records).subcategories.records.length, 0));
            });
        });

        it('should set the count integer value to the number of top-level records', function() {
            return request(server).get('/categories').then(function(response) {
                let count = response.body.count;
                let recordsLength = response.body.records.length;
                assert(count === recordsLength);
            });
        });

        it('should set the count integer value for a topic to the number of subcategories included in the category', function() {
            return request(server).get('/categories').then(function(response) {
                let count = _.first(response.body.records).subcategories.count;
                let recordsLength = _.first(response.body.records).subcategories.records.length;
                assert.equal(count, recordsLength);
            });
        });

        it('should localize category names based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/categories').query({lang: 'ja'});
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize category names based on the user.interface_language if authenticated & no "lang" & "accept-language" is different than "interface_language"', async function() {
            const response = await request(server).get('/categories').set(k.Header.Authorization, authorization).set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize category names based on the req.locale if the user is unauthenticated and the lang parameter is absent', async function() {
            const response = await request(server).get('/categories').set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Name]));
        });

        it('should localize subcategory names based on the lang query parameter if it is present', async function() {
            const response = await request(server).get('/categories').query({lang: 'ja'});
            assert(/[^a-z]/i.test(_.first(_.first(response.body.records).subcategories.records)[k.Attr.Name]));
        });

        it('should localize subcategory names based on the user.interface_language if no lang parameter is present', async function() {
            const response = await request(server).get('/categories').set(k.Header.Authorization, authorization);
            assert(/[a-z]/i.test(_.first(_.first(response.body.records).subcategories.records)[k.Attr.Name]));
        });

        it('should localize subcategory names based on the req.locale if the user is unauthenticated and the lang parameter is absent', async function() {
            const response = await request(server).get('/categories').set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[^a-z]/i.test(_.first(_.first(response.body.records).subcategories.records)[k.Attr.Name]));
        });

        describe('require_subcategories', function() {
            let childlessCategory;

            before(async function() {
                let languages = await db[k.Model.Language].findAll();
                languages = _.invokeMap(languages, 'get', {plain: true});
                childlessCategory = await db[k.Model.Category].create();
                await db[k.Model.CategoryLocalized].create({
                    name: 'EN_NAME',
                    category_id: childlessCategory.get(k.Attr.Id),
                    language_id: _.find(languages, {code: 'en'})[k.Attr.Id]
                });
                await db[k.Model.CategoryLocalized].create({
                    name: 'JA_NAME',
                    category_id: childlessCategory.get(k.Attr.Id),
                    language_id: _.find(languages, {code: 'ja'})[k.Attr.Id]
                });
            });

            it('should not include categories without subcategories by default', async function() {
                const response = await request(server).get('/categories');
                assert(!_.find(response.body.records, {id: childlessCategory.get(k.Attr.Id)}));
            });

            it('should not include categories without subcategories if require_subcategories is set to true', async function() {
                const response = await request(server).get('/categories').query({require_subcategories: true});
                assert(!_.find(response.body.records, {id: childlessCategory.get(k.Attr.Id)}));
            });

            it('should include categories without subcategories if require_subcategories is set to false', async function() {
                const response = await request(server).get('/categories').query({require_subcategories: false});
                assert(_.find(response.body.records, {id: childlessCategory.get(k.Attr.Id)}));
            });
        });
    });
});
