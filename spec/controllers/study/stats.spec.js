/**
 * stats.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/05.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /study/stats', function() {
    let authorization = null;
    let server        = null;
    let user          = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(result) {
            authorization = result.authorization;
            server        = result.server;
            user          = result.response.body;
            db            = result.db;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/study/en/stats').expect(401, done);
        });

        it(`should respond with 400 Bad Request if the 'lang' parameter is not a valid language code`, function(done) {
            request(server).get('/study/notValid/stats').set('authorization', authorization).expect(400, done);
        });
    });

    describe('success', function() {
        it('should response with 200 OK for a valid request', function(done) {
            request(server).get('/study/en/stats').set('authorization', authorization).expect(200, done);
        });

        it(`should contain a non-null 'lang' language code which is the same as the request param code`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert.equal('en', response.body.lang);
            });
        });

        it(`should contain a non-null 'total_time_studied' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.total_time_studied));
            });
        });

        it(`should contain a non-null 'consecutive_days' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.consecutive_days));
            });
        });

        it(`should contain a non-null 'total_study_sessions' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.total_study_sessions));
            });
        });

        it(`should contain a non-null 'longest_consecutive_days' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.longest_consecutive_days));
            });
        });

        it(`should contain a non-null 'maximum_words' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.maximum_words));
            });
        });

        it(`should contain a non-null 'maximum_wpm' number`, function() {
            return request(server).get('/study/en/stats').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.maximum_wpm));
            });
        });
    });
});
