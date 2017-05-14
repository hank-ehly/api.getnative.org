/**
 * register.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/24.
 */

const SpecUtil = require('../../spec-util');
const Utility  = require('../../../app/services').Utility;
const config   = require('../../../config');
const k        = require('../../../config/keys.json');

const request  = require('supertest');
const Promise  = require('bluebird');
const assert   = require('assert');
const i18n     = require('i18n');
const _        = require('lodash');

// todo: You don't want to allow someone to make 10,000 users via the commandline <- Use rate-limiting
// todo: Should User-Agents like 'curl' be allowed to use the API at all?
describe('POST /users', function() {
    let server  = null;
    let db      = null;
    let maildev = null;

    const user = {
        email: 'test123@email.com',
        password: 'test_password'
    };

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.startServer().then(function(initGroup) {
            maildev = initGroup.maildev;
            server  = initGroup.server;
            db      = initGroup.db;
        });
    });

    afterEach(function(done) {
        db.User.findOne({where: {email: user.email}}).then(function(user) {
            if (!user) {
                return server.close(done);
            }

            db[k.Model.StudySession].findAll({where: {user_id: user.id}, attributes: ['id']}).then(studySessions => {
                return db[k.Model.WritingAnswer].destroy({where: {study_session_id: {$in: studySessions.map(x => x.id)}}});
            }).then(() => {
                const forUser = {where: {user_id: user.id}};
                return Promise.all([
                    db[k.Model.Follower].destroy(forUser),
                    db[k.Model.Like].destroy(forUser),
                    db[k.Model.CuedVideo].destroy(forUser),
                    db[k.Model.Notification].destroy(forUser),
                    db[k.Model.StudySession].destroy(forUser),
                    db[k.Model.VerificationToken].destroy(forUser)
                ]);
            }).then(() => {
                return db.User.destroy({where: {email: user.email}});
            }).then(() => {
                server.close(done);
            });
        });
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with a 400 Bad Request response the 'email' field is missing`, function(done) {
            request(server).post('/users').send({password: user.password}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'email' field is not an email`, function(done) {
            request(server).post('/users').send({password: user.password, email: 'not_an_email'}).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' field is missing`, function(done) {
            request(server).post('/users').send({email: user.email}).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' is less than 8 characters`, function(done) {
            request(server).post('/users').send({email: user.email, password: 'lt8char'}).expect(400, done);
        });

        it(`should send a 422 Unprocessable Entity response if the registration email is already in use`, function(done) {
            request(server).post('/users').send(user).then(function() {
                request(server).post('/users').send(user).expect(422, done);
            });
        });
    });

    describe('response.success', function() {
        it('should respond with 200 OK for a successful request', function(done) {
            request(server).post('/users').send(user).expect(200, done);
        });

        it(`should respond with an object containing the user's ID`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(_.isNumber(response.body.id));
            });
        });

        it(`should not include the user password in the response`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(!response.body.password);
            });
        });

        it(`should create a new user whose email is the same as specified in the request`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert.equal(response.body.email, user.email);
            });
        });

        it(`should respond with an object containing the user's email address`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(SpecUtil.isValidEmail(response.body.email));
            });
        });

        it(`should respond with an object containing the user's preference for receiving browser notifications`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(_.isBoolean(response.body.browser_notifications_enabled));
            });
        });

        it(`should respond with an object containing the user's preference for receiving email notifications`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(_.isBoolean(response.body.email_notifications_enabled));
            });
        });

        it(`should respond with an object containing the user's email validity status`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(_.isBoolean(response.body.email_verified));
            });
        });

        it(`should respond with an object containing the user's default study language code`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert(new RegExp(/[a-z]+/).test(response.body.default_study_language_code));
            });
        });

        it(`should respond with an object containing the user's blank profile picture URL`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert.equal(response.body.picture_url, '');
            });
        });

        it(`should respond with the user's profile picture preference set to silhouette image`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                assert.equal(response.body.is_silhouette_picture, true);
            });
        });
    });

    describe('other', function() {
        it(`should send a confirmation email to the newly registered user after successful registration`, function() {
            return request(server).post('/users').send(user).then(function() {
                return SpecUtil.getAllEmail().then(function(emails) {
                    const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
                    assert.equal(recipientEmailAddress, user.email);
                });
            });
        });

        it(`should send a confirmation email from the get-native noreply user after successful registration`, function() {
            return request(server).post('/users').send(user).then(function() {
                return SpecUtil.getAllEmail().then(function(emails) {
                    const senderEmailAddress = _.last(emails).envelope.from.address;
                    const noreplyEmailAddress = config.get(k.NoReply);
                    assert.equal(senderEmailAddress, noreplyEmailAddress);
                });
            });
        });

        it(`should store the new users' password in an encrypted format that is not equal to the request`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db.User.findOne({where: {email: user.email}}).then(function(userFromDB) {
                    assert.notEqual(userFromDB.password, user.password);
                });
            });
        });

        it(`should create a new VerificationToken record pointing to the newly registered user`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db[k.Model.VerificationToken].findAll({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(tokens) {
                    assert.equal(tokens.length, 1);
                });
            });
        });

        it(`should send an email containing the confirmation URL (with the correct VerificationToken token)`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db[k.Model.VerificationToken].findOne({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        const expectedURL = `${config.get(k.Client.Protocol)}://${config.get(k.Client.Host)}/confirm_email?token=${token.token}`;
                        assert(_.includes(_.last(emails).html, expectedURL));
                    });
                });
            });
        });

        it(`should send an email from the noreply user`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db[k.Model.VerificationToken].findOne({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.last(emails).envelope.from.address, config.get(k.NoReply));
                    });
                });
            });
        });

        it(`should send an email to the newly registered user`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db[k.Model.VerificationToken].findOne({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.first(_.last(emails).envelope.to).address, user.email);
                    });
                });
            });
        });

        it(`should send an email with the appropriate subject`, function() {
            return request(server).post('/users').send(user).then(function(response) {
                return db[k.Model.VerificationToken].findOne({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.last(emails).subject, i18n.__('welcome.title'));
                    });
                });
            });
        });
    });
});