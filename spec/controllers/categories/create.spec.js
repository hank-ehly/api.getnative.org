/**
 * create.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services')['Auth'];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /categories', function() {
    let newCategoryName = null;
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
        newCategoryName = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if no category name is provided', function(done) {
            request(server).post('/categories').set(k.Header.Authorization, authorization).send({}).expect(400, done);
        });

        it('should respond with 400 Bad Request if the provided category name is not a string', function(done) {
            request(server).post('/categories').set(k.Header.Authorization, authorization).send({name: _.stubObject()}).expect(400, done);
        });

        it('should respond with 400 Bad Request if the provided category name is 0 length', function(done) {
            request(server).post('/categories').set(k.Header.Authorization, authorization).send({name: _.stubString()}).expect(400, done);
        });

        it('should respond with 400 Bad Request if the provided category name is over 50 length', function(done) {
            const name = _.times(51, 'x').join('');
            request(server).post('/categories').set(k.Header.Authorization, authorization).send({name: name}).expect(400, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization)
                .send({name: newCategoryName});

            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization)
                .send({name: newCategoryName});

            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should set the Location header to the newly created category detail page', async function() {
            const response = await request(server).post('/categories').set(k.Header.Authorization, authorization)
                .send({name: newCategoryName});

            const category = await db[k.Model.Category].find({
                where: {
                    name: newCategoryName
                },
                attributes: [
                    k.Attr.Id
                ]
            });

            const categoryId = category.get(k.Attr.Id);

            assert.equal(response.header[k.Header.Location], `/categories/${categoryId}`);
        });

        it('should respond with 201 Created for a valid request', function(done) {
            request(server).post('/categories').set(k.Header.Authorization, authorization).send({name: newCategoryName}).expect(201, done);
        });

        it('should create a new Category record', async function() {
            await request(server).post('/categories').set(k.Header.Authorization, authorization).send({name: newCategoryName});

            const category = await db[k.Model.Category].find({
                where: {
                    name: newCategoryName
                },
                attributes: [
                    k.Attr.Id
                ]
            });

            assert(category);
        });
    });
});
