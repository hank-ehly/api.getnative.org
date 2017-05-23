/**
 * password.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/05.
 */

const Auth     = require('../../../app/services')['Auth'];
const SpecUtil = require('../../spec-util');
const Promise  = require('bluebird');
const config   = require('../../../config/application').config;
const k        = require('../../../config/keys.json');

const request  = require('supertest');
const assert   = require('assert');
const i18n     = require('i18n');
const _        = require('lodash');

describe('POST /users/password', function() {
    let authorization = null;
    let server        = null;
    let user          = null;
    let db            = null;

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
        return SpecUtil.login().then(function(results) {
            authorization = results.authorization;
            server        = results.server;
            user          = results.response.body;
            db            = results.db;
        });
    });

    afterEach(function(done) {
        const hashPassword = Auth.hashPassword(validBody.current_password);
        db[k.Model.Credential].update({
            password: hashPassword
        }, {
            where: {
                user_id: user[k.Attr.Id]
            }
        }).then(() => {
            server.close(done);
        });
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('response.success', function() {
        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).post('/users/password').set('authorization', authorization).send(validBody).expect(204, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                // superagent returns {} if the body is undefined, so we must check for that
                // behind the scenes: this.body = res.body !== undefined ? res.body : {};
                assert.equal(_.size(response.body), 0);
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).post('/users/password').send(validBody).expect(401, done);
        });

        it(`should return 400 Bad Request if the new_password request parameter is not present`, function(done) {
            const data = _.omit(validBody, ['new_password']);
            request(server).post('/users/password').set('authorization', authorization).send(data).expect(400, done);
        });

        it(`should return 400 Bad Request if the new_password request parameter is not a string`, function(done) {
            request(server).post('/users/password').set('authorization', authorization).send({
                current_password: validBody[k.Attr.CurrentPassword],
                new_password: true
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the current_password request parameter is not present`, function(done) {
            const data = _.omit(validBody, [k.Attr.CurrentPassword]);
            request(server).post('/users/password').set('authorization', authorization).send(data).expect(400, done);
        });

        it(`should return 400 Bad Request if the current_password request parameter is not a string`, function(done) {
            request(server).post('/users/password').set('authorization', authorization).send({
                current_password: true,
                new_password: validBody[k.Attr.NewPassword]
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the new_password length is less than 8 characters`, function(done) {
            request(server).post('/users/password').set('authorization', authorization).send({
                current_password: validBody.current_password,
                new_password: '1234'
            }).expect(400, done);
        });
    });

    describe('other', function() {
        it(`should change the users' password`, function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function() {
                return db[k.Model.Credential].findOne({
                    where: {
                        user_id: user[k.Attr.Id]
                    }
                }).then(function(credential) {
                    assert(Auth.verifyPassword(credential[k.Attr.Password], validBody[k.Attr.NewPassword]));
                });
            });
        });

        it(`sends an email to the user who changed their password`, function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.first(_.last(emails).envelope.to).address, user[k.Attr.Email]);
                });
            });
        });

        it(`sends an email from the noreply address`, function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.last(emails).envelope.from.address, config.get(k.NoReply));
                });
            });
        });

        it(`sends a changed password confirmation email`, function() {
            return request(server).post('/users/password').set('authorization', authorization).send(validBody).then(function(response) {
                return SpecUtil.getAllEmail().then(function(emails) {
                    assert.equal(_.last(emails).subject, i18n.__('password-updated.title'));
                });
            });
        });
    });
});

