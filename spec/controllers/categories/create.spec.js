/**
 * create.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
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

describe('POST /categories', function() {
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
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 201 Created for a valid request', function(done) {
            request(server).post('/categories').set(k.Header.Authorization, authorization).expect(201, done);
        });

        it('should set the Location header to the newly created category detail page', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);

            const categories = await db[k.Model.Category].findAll({
                attributes: [k.Attr.Id],
                order: [[k.Attr.Id, 'DESC']]
            });

            assert.equal(response.header[k.Header.Location], `/categories/${_.first(categories).get(k.Attr.Id)}`);
        });

        it('should create a new Category record', async function() {
            const beforeCount = await db[k.Model.Category].count();
            await request(server).post('/categories').set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.Category].count();
            assert.equal(afterCount, beforeCount + 1);
        });

        it('should create a new CategoryLocalized record for each language', async function() {
            const beforeCount = await db[k.Model.CategoryLocalized].count();
            await request(server).post('/categories').set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.CategoryLocalized].count();
            assert.equal(afterCount, beforeCount + _.size(config.get(k.VideoLanguageCodes)));
        });

        it('should return a top level "id" number', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should return a correctly formatted top level "created_at" string', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.CreatedAt]));
        });

        it('should return a correctly formatted top level "updated_at" string', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(SpecUtil.isClientFriendlyDateString(response.body[k.Attr.UpdatedAt]));
        });

        it('should return a top level "categories_localized" object', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(response.body.categories_localized));
        });

        it('should return a "categories_localized.records" array', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isArray(response.body.categories_localized.records));
        });

        it('should return a "categories_localized.count" integer', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isNumber(response.body.categories_localized.count));
        });

        it('should return more than 1 localized category record', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.gt(response.body.categories_localized.count, 1));
        });

        it('should return a "categories_localized.records[N].language" object', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isPlainObject(_.first(response.body.categories_localized.records).language));
        });

        it('should return a "categories_localized.records[N].language.name" string', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.categories_localized.records).language[k.Attr.Name]));
        });

        it('should return a "categories_localized.records[N].language.code" string', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.categories_localized.records).language[k.Attr.Code]));
        });

        it('should return a "categories_localized.records[N].name" string', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isString(_.first(response.body.categories_localized.records)[k.Attr.Name]));
        });

        it('should return a "categories_localized.records[N].id" integer', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization);
            assert(_.isNumber(_.first(response.body.categories_localized.records)[k.Attr.Id]));
        });
    });
});
