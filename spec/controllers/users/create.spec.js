/**
 * register.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/24.
 */

const SpecUtil = require('../../spec-util');
const Utility  = require('../../../app/services')['Utility'];
const config   = require('../../../config');
const k        = require('../../../config/keys.json');

const request  = require('supertest');
const Promise  = require('bluebird');
const chance   = require('chance').Chance();
const assert   = require('assert');
const i18n     = require('i18n');
const _        = require('lodash');

// todo: You don't want to allow someone to make 10,000 users via the commandline <- Use rate-limiting
// todo: Should User-Agents like 'curl' be allowed to use the API at all?
describe('POST /users', function() {
    let server  = null;
    let db      = null;
    let maildev = null;

    const credential = {
        email: '',
        password: '12345678'
    };

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);

        credential.email = chance.email();

        return SpecUtil.startServer().then(function(result) {
            maildev = result.maildev;
            server  = result.server;
            db      = result.db;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.gt(response.header['x-gn-auth-token'].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with a 400 Bad Request response the 'email' field is missing`, function(done) {
            request(server).post('/users').send({password: credential.password}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'email' field is not an email`, function(done) {
            request(server).post('/users').send({password: credential.password, email: 'not_an_email'}).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' field is missing`, function(done) {
            request(server).post('/users').send({email: credential.email}).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' is less than 8 characters`, function(done) {
            request(server).post('/users').send({email: credential.email, password: 'lt8char'}).expect(400, done);
        });

        it(`should send a 422 Unprocessable Entity response if the registration email is already in use`, function(done) {
            request(server).post('/users').send(credential).then(function() {
                request(server).post('/users').send(credential).expect(422, done);
            });
        });
    });

    describe('response.success', function() {
        it('should respond with 201 Created for a successful request', function(done) {
            request(server).post('/users').send(credential).expect(201, done);
        });

        it(`should respond with an object containing the user's ID`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isNumber(response.body.id));
            });
        });

        it(`should not include the user password in the response`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(!response.body.password);
            });
        });

        it(`should create a new user whose email is the same as specified in the request`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert.equal(response.body.email, credential.email);
            });
        });

        it(`should respond with an object containing the user's email address`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(SpecUtil.isValidEmail(response.body.email));
            });
        });

        it(`should respond with an object containing the user's preference for receiving browser notifications`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isBoolean(response.body.browser_notifications_enabled));
            });
        });

        it(`should respond with an object containing the user's preference for receiving email notifications`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isBoolean(response.body.email_notifications_enabled));
            });
        });

        it(`should respond with an object containing the user's email validity status`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isBoolean(response.body.email_verified));
            });
        });

        it(`should respond with an object containing the user's default study language object`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isPlainObject(response.body[k.Attr.DefaultStudyLanguage]));
            });
        });

        it(`should respond with an object containing the user's default study language name`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isString(response.body[k.Attr.DefaultStudyLanguage].name));
            });
        });

        it(`should respond with an object containing the user's default study language code`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isString(response.body[k.Attr.DefaultStudyLanguage].code));
            });
        });

        it(`should respond with an object containing the user's blank profile picture URL`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert.equal(response.body.picture_url, '');
            });
        });

        it(`should respond with the user's profile picture preference set to silhouette image`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert.equal(response.body.is_silhouette_picture, true);
            });
        });
    });

    describe('other', function() {
        it(`should send a confirmation email to the newly registered user after successful registration`, function() {
            return request(server).post('/users').send(credential).then(function() {
                return SpecUtil.getAllEmail().then(function(emails) {
                    const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
                    assert.equal(recipientEmailAddress, credential.email);
                });
            });
        });

        it(`should send a confirmation email from the get-native noreply user after successful registration`, function() {
            return request(server).post('/users').send(credential).then(function() {
                return SpecUtil.getAllEmail().then(function(emails) {
                    const senderEmailAddress = _.last(emails).envelope.from.address;
                    const noreplyEmailAddress = config.get(k.NoReply);
                    assert.equal(senderEmailAddress, noreplyEmailAddress);
                });
            });
        });

        it(`should store the new users' password in an encrypted format that is not equal to the request`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.Credential].findOne({where: {email: credential.email}}).then(function(credentialFromDB) {
                    assert.notEqual(credentialFromDB.password, credential.password);
                });
            });
        });

        it(`should create a new VerificationToken record pointing to the newly registered user`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
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
            return request(server).post('/users').send(credential).then(function(response) {
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
            return request(server).post('/users').send(credential).then(function(response) {
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
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.VerificationToken].findOne({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.first(_.last(emails).envelope.to).address, credential.email);
                    });
                });
            });
        });

        it(`should send an email with the appropriate subject`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
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
