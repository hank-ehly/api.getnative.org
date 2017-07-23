/**
 * confirm-registration-email.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/18.
 */

const SpecUtil = require('../../spec-util');
const Auth     = require('../../../app/services')['Auth'];
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const moment   = require('moment');
const chance   = require('chance').Chance();
const _        = require('lodash');

describe('POST /confirm_email', function() {
    let server = null;
    let token  = null;
    let user   = null;
    let db     = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.startServer().then(function(results) {
            server = results.server;
            db     = results.db;

            return db.sequelize.query(`UPDATE users SET email_verified = true`).then(function() {
                return db.sequelize.query(`SELECT id FROM users LIMIT 1`);
            }).then(function(result) {
                user = _.toPlainObject(result[0][0]);
                return db[k.Model.VerificationToken].create({
                    user_id: user[k.Attr.Id],
                    token: Auth.generateRandomHash(),
                    expiration_date: moment().add(1, 'days').toDate()
                });
            }).then(function(_token) {
                token = _token.get(k.Attr.Token);
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
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.gt(response.headers['x-gn-auth-token'].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.headers['x-gn-auth-expire']));
            });
        });
    });

    describe('failure', function() {
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
            db[k.Model.VerificationToken].create({
                user_id: user.id,
                token: Auth.generateRandomHash(),
                expiration_date: moment().subtract(1, 'days').toDate()
            }).then(function(_token) {
                request(server).post(`/confirm_email`).send({token: _token.get(k.Attr.Token)}).expect(404, done);
            });
        });
    });

    describe('success', function() {
        it(`should respond with 200 OK if the verification succeeds`, function(done) {
            request(server).post(`/confirm_email`).send({token: token}).expect(200, done);
        });

        it('should respond with an object containing the user\'s ID', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isNumber(response.body[k.Attr.Id]));
            });
        });

        it('should respond with an object containing the user\'s email address', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(SpecUtil.isValidEmail(response.body[k.Attr.Email]));
            });
        });

        it('should respond with an object containing the user\'s preference for receiving browser notifications', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isBoolean(response.body[k.Attr.BrowserNotificationsEnabled]));
            });
        });

        it(`should not include the user password in the response`, function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(!response.body[k.Attr.Password]);
            });
        });

        it('should respond with an object containing the user\'s preference for receiving email notifications', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isBoolean(response.body[k.Attr.EmailNotificationsEnabled]));
            });
        });

        it('should respond with an object containing the user\'s email validity status', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isBoolean(response.body[k.Attr.EmailVerified]));
            });
        });

        it('should respond with an object containing a top level default_study_language object', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isPlainObject(response.body[k.Attr.DefaultStudyLanguage]));
            });
        });

        it('should respond with an object containing a top level default_study_language.name string', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isString(response.body[k.Attr.DefaultStudyLanguage][k.Attr.Name]));
            });
        });

        it('should respond with an object containing a top level default_study_language.code string', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isString(response.body[k.Attr.DefaultStudyLanguage][k.Attr.Code]));
            });
        });

        it('should respond with an object containing the user\'s profile picture URL', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(SpecUtil.isValidURL(response.body[k.Attr.PictureUrl]));
            });
        });

        it('should respond with an object containing the user\'s preference for using the profile picture or silhouette image', function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function(response) {
                assert(_.isBoolean(response.body[k.Attr.IsSilhouettePicture]));
            });
        });

        it(`should change the user email_verified value to true if verification succeeds`, function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function() {
                return db[k.Model.User].findByPrimary(user[k.Attr.Id]);
            }).then(function(a) {
                assert.equal(a.get(k.Attr.EmailVerified), true);
            });
        });

        it(`should change the user email_notifications_enabled value to true if verification succeeds`, function() {
            return request(server).post(`/confirm_email`).send({token: token}).then(function() {
                return db[k.Model.User].findByPrimary(user[k.Attr.Id]);
            }).then(function(a) {
                assert.equal(a.get(k.Attr.EmailNotificationsEnabled), true);
            });
        });
    });

    it(`should use the VerificationToken with the most recent expiration_date if multiple tokens exist`);
});