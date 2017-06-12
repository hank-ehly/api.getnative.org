/**
 * create.spec
 * api.get-native.com
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
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
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

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
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
    });
});
