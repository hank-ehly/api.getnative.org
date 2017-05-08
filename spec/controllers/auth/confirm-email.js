/**
 * confirm-email
 * get-native.com
 *
 * Created by henryehly on 2017/04/18.
 */

const SpecUtil = require('../../spec-util');
const Auth     = require('../../../app/services').Auth;

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const moment   = require('moment');
const crypto   = require('crypto');
const _        = require('lodash');

// todo: Change to use json request body -- the query parameter thing is only for the client
describe('POST /confirm_email', function() {
    let account = null;
    let server  = null;
    let db      = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.startServer().then(function(initGroup) {
            server = initGroup.server;
            db     = initGroup.db;

            return db.Account.create({
                email: 'test-' + crypto.randomBytes(8).toString('hex') + '@email.com',
                password: Auth.hashPassword('12345678')
            }).then(function(_) {
                account = _;
            });
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
            return db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                return request(server).post(`/confirm_email`).send({token: token.get('token')}).then(function(response) {
                    assert(_.gt(response.headers['x-gn-auth-token'].length, 0));
                });
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                return request(server).post(`/confirm_email`).send({token: token.get('token')}).then(function(response) {
                    assert(SpecUtil.isParsableTimestamp(+response.headers['x-gn-auth-expire']));
                });
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 400 Bad Request if the 'token' body parameter is missing`, function(done) {
            request(server).post('/confirm_email').expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'token' query parameter is less than 32 characters in length`, function(done) {
            request(server).post('/confirm_email').send({token: 'less_than_32_characters'}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'token' query parameter is more than 32 characters in length`, function(done) {
            request(server).post('/confirm_email').send('more_than_32_characters_more_than_32_characters').expect(400, done);
        });

        it(`should respond with 404 Not Found if the verification token does not exist`, function(done) {
            request(server).post('/confirm_email').send({token: 'bf294bed1332e34f9faf00413d0e61ab'}).expect(404, done);
        });

        it(`should respond with 404 Not Found if the verification token is expired`, function(done) {
            db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().subtract(1, 'days').toDate()
            }).then(function(token) {
                request(server).post(`/confirm_email`).send({token: token.get('token')}).expect(404, done);
            });
        });
    });

    describe('response.success', function() {
        it(`should respond with 200 OK if the verification succeeds`, function(done) {
            db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                request(server).post(`/confirm_email`).send({token: token.get('token')}).expect(200, done);
            });
        });

        it(`should change the account email_verified value to true if verification succeeds`, function() {
            return db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                return request(server).post(`/confirm_email`).send({token: token.get('token')});
            }).then(function() {
                return db.Account.findById(account.id);
            }).then(function(a) {
                assert.equal(a.get('email_verified'), true);
            });
        });

        it(`should change the account email_notifications_enabled value to true if verification succeeds`, function() {
            return db.VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                return request(server).post(`/confirm_email`).send({token: token.get('token')});
            }).then(function() {
                return db.Account.findById(account.id);
            }).then(function(a) {
                assert.equal(a.get('email_notifications_enabled'), true);
            });
        });
    });

    it(`should use the VerificationToken with the most recent expiration_date if multiple tokens exist`);
});
