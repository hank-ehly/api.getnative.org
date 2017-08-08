/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/12.
 */

const SpecUtil = require('../../spec-util');
const Auth = require('../../../app/services')['Auth'];
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('PATCH /subcategories/:subcategory_id/subcategories_localized/:subcategories_localized_id', function() {
    let randomHash = null;
    let realSubcategoryLocalizedId = null;
    let realSubcategoryId = null;
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

        let subcategory = await db[k.Model.Subcategory].find({
            attributes: [k.Attr.Id],
            include: {
                model: db[k.Model.SubcategoryLocalized],
                attributes: [k.Attr.Id],
                as: 'subcategories_localized'
            }
        });

        subcategory = subcategory.get({
            plain: true
        });

        realSubcategoryId = subcategory[k.Attr.Id];
        realSubcategoryLocalizedId = _.first(subcategory.subcategories_localized)[k.Attr.Id];
        randomHash = Auth.generateRandomHash();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if the :subcategory_id parameter is not a number', function(done) {
            request(server)
                .patch(`/subcategories/not_a_number/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(400, done);
        });

        it('should return 404 Not Found if no Subcategory record for the provided :subcategory_id exists', function(done) {
            request(server)
                .patch(`/subcategories/99999/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(404, done);
        });

        it('should return 400 Bad Request if the :subcategories_localized_id parameter is not a number', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/not_a_number`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(400, done);
        });

        it('should return 404 Not Found if no SubcategoryLocalized record for the provided :subcategories_localized_id exists', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryLocalizedId}/subcategories_localized/99999`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(404, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is not a string', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: _.stubObject()})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is 0 length', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: _.stubString()})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "name" body parameter is over 50 characters long', function(done) {
            const longString = _.times(51, 'x').join('');
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: longString})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "subcategory_id" query parameter is 0', function(done) {
            request(server)
                .patch(`/subcategories/0/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(400, done);
        });

        it('should return 400 Bad Request if the "subcategories_localized_id" query parameter is 0', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryLocalizedId}/subcategories_localized/0`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(400, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash});
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash});
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content if the request succeeds', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: randomHash})
                .expect(204, done);
        });

        it('should return 304 Not Modified if the body is empty', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({})
                .expect(304, done);
        });

        it('should return 304 Not Modified if the body only contains invalid keys', function(done) {
            request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({foo: 'bar'})
                .expect(304, done);
        });

        it('should update the name of the SubcategoryLocalized record', async function() {
            const name = 'NEW_NAME';

            await request(server)
                .patch(`/subcategories/${realSubcategoryId}/subcategories_localized/${realSubcategoryLocalizedId}`)
                .set(k.Header.Authorization, authorization)
                .send({name: name});

            const subcategoryLocalized = await db[k.Model.SubcategoryLocalized].findByPrimary(realSubcategoryLocalizedId);

            assert.equal(subcategoryLocalized.get(k.Attr.Name), name);
        });
    });
});
