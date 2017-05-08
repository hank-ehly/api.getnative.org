/**
 * password.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/05.
 */

const AuthHelper = require('../../../app/services').Auth;
const SpecUtil   = require('../../spec-util');
const Promise    = require('bluebird');
const config     = require('../../../config');
const k          = require('../../../config/keys.json');

const request    = require('supertest');
const assert     = require('assert');
const i18n       = require('i18n');
const _          = require('lodash');

describe('POST /account/password', function() {
    let server        = null;
    let authorization = null;
    let db            = null;
    let account       = null;

    const validBody = {
        new_password: '87654321',
        current_password: SpecUtil.credentials.password
    };

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server = _.server;
            authorization = _.authorization;
            db = _.db;
            account = _.response.body;
        });
    });

    afterEach(function(done) {
        let hashPassword = AuthHelper.hashPassword(validBody.current_password);
        db.Account.update({password: hashPassword}, {where: {id: account.id}}).then(() => {
            server.close(done);
        });
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.success', function() {
        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).post('/account/password').set('authorization', authorization).send(validBody).expect(204, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                // superagent returns {} if the body is undefined, so we must check for that
                // behind the scenes: this.body = res.body !== undefined ? res.body : {};
                assert.equal(_.size(response.body), 0);
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post('/account/password').send(validBody).expect(401, done);
        });

        it(`should return 400 Bad Request if the new_password request parameter is not present`, function(done) {
            const data = _.omit(validBody, ['new_password']);
            request(server).post('/account/password').set('authorization', authorization).send(data).expect(400, done);
        });

        it(`should return 400 Bad Request if the new_password request parameter is not a string`, function(done) {
            request(server).post('/account/password').set('authorization', authorization).send({
                current_password: validBody.current_password,
                new_password: true
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the current_password request parameter is not present`, function(done) {
            const data = _.omit(validBody, ['current_password']);
            request(server).post('/account/password').set('authorization', authorization).send(data).expect(400, done);
        });

        it(`should return 400 Bad Request if the current_password request parameter is not a string`, function(done) {
            request(server).post('/account/password').set('authorization', authorization).send({
                current_password: true,
                new_password: validBody.new_password
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the new_password length is less than 8 characters`, function(done) {
            request(server).post('/account/password').set('authorization', authorization).send({
                current_password: validBody.current_password,
                new_password: '1234'
            }).expect(400, done);
        });
    });

    describe('other', function() {
        it(`should change the users' password`, function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function() {
                return db.Account.findById(account.id).then(function(_account) {
                    assert(AuthHelper.verifyPassword(_account.password, validBody.new_password));
                });
            });
        });

        it(`sends an email to the user who changed their password`, function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.first(_.last(emails).envelope.to).address, account.email);
                });
            });
        });

        it(`sends an email from the noreply address`, function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.last(emails).envelope.from.address, config.get(k.NoReply));
                });
            });
        });

        it(`sends a changed password confirmation email`, function() {
            return request(server).post('/account/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.last(emails).subject, i18n.__('password-updated.title'));
                });
            });
        });
    });
});

