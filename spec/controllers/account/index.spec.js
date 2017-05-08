/**
 * index.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/15.
 */

const SpecUtil = require('../../spec-util');

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /account', function() {
    let authorization = null;
    let server        = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            authorization = _.authorization;
            server        = _.server;
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
            return request(server).get('/account').set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/account').expect(401, done);
        });
    });

    describe('response.success', function() {
        it('should respond with 200 OK for valid requests', function(done) {
            request(server).get('/account').set('authorization', authorization).expect(200, done);
        });

        it('should respond with an object containing the user\'s ID', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(_.isNumber(res.body.id));
            });
        });

        it('should respond with an object containing the user\'s email address', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(SpecUtil.isValidEmail(res.body.email));
            });
        });

        it('should respond with an object containing the user\'s preference for receiving browser notifications', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(_.isBoolean(res.body.browser_notifications_enabled));
            });
        });

        it('should respond with an object containing the user\'s preference for receiving email notifications', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(_.isBoolean(res.body.email_notifications_enabled));
            });
        });

        it('should respond with an object containing the user\'s email validity status', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(_.isBoolean(res.body.email_verified));
            });
        });

        it('should respond with an object containing the user\'s default study language code', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(new RegExp(/^[a-z]+$/).test(res.body.default_study_language_code));
            });
        });

        it('should respond with an object containing the user\'s profile picture URL', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(SpecUtil.isValidURL(res.body.picture_url));
            });
        });

        it('should respond with an object containing the user\'s preference for using the profile picture or silhouette image', function() {
            return request(server).get('/account').set('authorization', authorization).then(function(res) {
                assert(_.isBoolean(res.body.is_silhouette_picture));
            });
        });
    });
});
