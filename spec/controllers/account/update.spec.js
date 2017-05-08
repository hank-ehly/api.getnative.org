/**
 * update.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/04.
 */

const assert = require('assert');
const request = require('supertest');
const SpecUtil = require('../../spec-util');
const _ = require('lodash');

describe('PATCH /account', function() {
    let server        = null;
    let authorization = null;
    let db            = null;
    let account       = null;

    const context = {
        email_notifications_enabled: false,
        browser_notifications_enabled: false,
        default_study_language_code: 'en'
    };

    const validBody = {email_notifications_enabled: true};

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server = _.server;
            authorization = _.authorization;
            db = _.db;
            account = _.response.body;
            return db.Account.update(context, {where: {id: account.id}});
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
            return request(server).patch('/account').set('authorization', authorization).send(validBody).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).patch('/account').set('authorization', authorization).send(validBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.success', function() {
        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).patch('/account').set('authorization', authorization).send(validBody).expect(204, done);
        });

        it(`should respond with 304 Not Modified if the request can authenticate but contains no body`, function(done) {
            request(server).patch('/account').set('authorization', authorization).expect(304, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).patch('/account').set('authorization', authorization).send(validBody).then(function(response) {
                // superagent returns {} if the body is undefined, so we must check for that
                // behind the scenes: this.body = res.body !== undefined ? res.body : {};
                assert.equal(_.size(response.body), 0);
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).patch('/account').send(validBody).expect(401, done);
        });

        it(`should return 400 Bad Request if the email_notifications_enabled request parameter is not a boolean`, function(done) {
            request(server).patch('/account').set('authorization', authorization).send({
                email_notifications_enabled: 'not_a_boolean'
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the browser_notifications_enabled request parameter is not a boolean`, function(done) {
            request(server).patch('/account').set('authorization', authorization).send({
                browser_notifications_enabled: 'not_a_boolean'
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the default_study_language_code request parameter is not valid`, function(done) {
            request(server).patch('/account').set('authorization', authorization).send({
                default_study_language_code: 'not_a_lang_code'
            }).expect(400, done);
        });
    });

    describe('other', function() {
        it(`should change the users' email_notifications_enabled setting`, function() {
            return request(server).patch('/account').set('authorization', authorization).send({email_notifications_enabled: true}).then(function() {
                return db.Account.findById(account.id).then(function(_account) {
                    assert.equal(_account.email_notifications_enabled, true);
                });
            });
        });

        it(`should change the users' browser_notifications_enabled setting`, function() {
            return request(server).patch('/account').send({browser_notifications_enabled: true}).set('authorization', authorization).then(function() {
                return db.Account.findById(account.id).then(function(_account) {
                    assert.equal(_account.browser_notifications_enabled, true);
                });
            });
        });

        it(`should change the users' default_study_language_code setting`, function() {
            return request(server).patch('/account').set('authorization', authorization).send({default_study_language_code: 'ja'}).then(function() {
                return db.Account.findById(account.id).then(function(_account) {
                    assert.equal(_account.default_study_language_code, 'ja');
                });
            });
        });
    });
});
