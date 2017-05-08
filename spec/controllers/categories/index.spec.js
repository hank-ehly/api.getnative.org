/**
 * index
 * get-native.com
 *
 * Created by henryehly on 2017/03/02.
 */

const SpecUtil = require('../../spec-util');

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /categories', function() {
    let server        = null;
    let authorization = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server        = _.server;
            authorization = _.authorization;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/categories').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/categories').expect(401, done);
        });
    });

    describe('response.success', function() {
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
                assert(count === recordsLength);
            });
        });
    });
});
