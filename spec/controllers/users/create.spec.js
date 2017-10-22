/**
 * register.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/24.
 */

const SpecUtil = require('../../spec-util');
const Utility = require('../../../app/services')['Utility'];
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const chance = require('chance').Chance();
const assert = require('assert');
const i18n = require('i18n');
const _ = require('lodash');

// todo: You don't want to allow someone to make 10,000 users via the commandline <- Use rate-limiting
// todo: Should User-Agents like 'curl' be allowed to use the API at all?
describe('POST /users', function() {
    let maildev = null;
    let server = null;
    let db = null;

    const credential = {
        password: '12345678'
    };

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);

        credential.email = chance.email();

        return SpecUtil.startServer().then(function(result) {
            maildev = result.maildev;
            server = result.server;
            db = result.db;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with a 400 Bad Request response the 'email' field is missing`, function(done) {
            request(server).post('/users').send({password: credential.password}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'email' field is not an email`, function(done) {
            request(server).post('/users').send({
                password: credential.password,
                email: 'not_an_email'
            }).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' field is missing`, function(done) {
            request(server).post('/users').send({email: credential.email}).expect(400, done);
        });

        it(`should respond with a 400 Bad Request response the 'password' is less than 8 characters`, function(done) {
            request(server).post('/users').send({
                email: credential.email,
                password: 'lt8char'
            }).expect(400, done);
        });

        it(`should send a 422 Unprocessable Entity response if the registration email is already in use`, async function() {
            await request(server).post('/users').send(credential);
            return request(server).post('/users').send(credential).expect(422);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

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
                assert.equal(response.body.email_verified, false);
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

        it(`should respond with an object containing the user's interface study language object`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isPlainObject(response.body[k.Attr.InterfaceLanguage]));
            });
        });

        it(`should respond with an object containing the user's interface study language name`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isString(response.body[k.Attr.InterfaceLanguage].name));
            });
        });

        it(`should respond with an object containing the user's interface study language code`, function() {
            return request(server).post('/users').send(credential).then(function(response) {
                assert(_.isString(response.body[k.Attr.InterfaceLanguage].code));
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
        it('should set the user interface_language to the browser locale', async function() {
            const response = await request(server).post('/users').set('accept-language', 'ja-JP,ja;q=0.8,en;q=0.6').send(credential);
            const user = await db[k.Model.User].findByPrimary(response.body[k.Attr.Id], {
                include: [
                    {
                        model: db[k.Model.Language],
                        as: 'interface_language'
                    }
                ]
            });
            assert.equal(user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code), 'ja');
        });

        it('should create a new "UserRole" role record with "user" permissions for the new user', async function() {
            await request(server).post('/users').send(credential);

            const user = await db[k.Model.User].find({
                where: {
                    email: credential.email
                }
            });

            const userRole = await db[k.Model.UserRole].find({where: {user_id: user.get(k.Attr.Id)}});
            const role = await db[k.Model.Role].find({where: {name: k.UserRole.User}});

            assert.equal(userRole.get('role_id'), role.get(k.Attr.Id));
        });

        it(`should create an Identity record containing the new user ID and an auth type of 'local'`, function() {
            return request(server).post('/users').send(credential).then(function() {
                return db[k.Model.User].find({
                    where: {
                        email: credential.email
                    }
                }).then(function(user) {
                    return db[k.Model.Identity].find({
                        where: {
                            user_id: user.get(k.Attr.Id)
                        }
                    });
                }).then(function(identity) {
                    const authType = db[k.Model.AuthAdapterType].find({
                        where: {
                            name: 'local'
                        },
                        attributes: [
                            k.Attr.Id
                        ]
                    });

                    return Promise.all([identity, authType]);
                }).then(function(values) {
                    const [identity, authType] = values;
                    assert.equal(identity.get('auth_adapter_type_id'), authType.get(k.Attr.Id));
                });
            });
        });

        it('should create a local Identity record even if a user already has a facebook Identity', async function() {
            const language = await db[k.Model.Language].find();
            const user = await db[k.Model.User].create({
                email: credential[k.Attr.Email],
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id)
            });

            const facebookProviderId = await db[k.Model.AuthAdapterType].findIdForProvider('facebook');
            const localProviderId = await db[k.Model.AuthAdapterType].findIdForProvider('local');

            await db[k.Model.Identity].create({
                auth_adapter_type_id: facebookProviderId,
                user_id: user.get(k.Attr.Id)
            });

            const response = await request(server).post('/users').send(credential);

            const identities = await db[k.Model.Identity].findAll({
                where: {user_id: response.body[k.Attr.Id]}
            });

            assert.equal(identities.length, 2);
            assert(_.find(identities, {auth_adapter_type_id: facebookProviderId}));
            assert(_.find(identities, {auth_adapter_type_id: localProviderId}));
        });

        it('should create Credential record if a user already has a facebook Identity', function() {
            const cache = {};

            return db[k.Model.Language].find().then(function(language) {
                const findAuthAdapterTypes = db[k.Model.AuthAdapterType].findAll();

                const createUser = db[k.Model.User].create({
                    email: credential[k.Attr.Email],
                    default_study_language_id: language.get(k.Attr.Id),
                    interface_language_id: language.get(k.Attr.Id)
                });

                return Promise.all([findAuthAdapterTypes, createUser]);
            }).then(function(values) {
                const [authAdapterTypes, user] = values;
                cache.authAdapterTypes = authAdapterTypes;

                return db[k.Model.Identity].create({
                    auth_adapter_type_id: _.find(authAdapterTypes, {name: 'facebook'}).get(k.Attr.Id),
                    user_id: user.get(k.Attr.Id)
                });
            }).then(function() {
                return request(server).post('/users').send(credential).then(function(response) {
                    return db[k.Model.Credential].find({
                        where: {
                            user_id: response.body[k.Attr.Id]
                        }
                    }).then(function(newCredential) {
                        assert(newCredential);
                    });
                });
            });
        });

        it('should send a confirmation email to the newly registered user after successful registration', async function() {
            await request(server).post('/users').send(credential);
            const emails = await SpecUtil.getAllEmail();
            const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
            assert.equal(recipientEmailAddress, credential.email);
        });

        it('should send a confirmation email from the getnative noreply user after successful registration', async function() {
            await request(server).post('/users').send(credential);
            const emails = await SpecUtil.getAllEmail();
            const senderEmailAddress = _.last(emails).envelope.from.address;
            const noreplyEmailAddress = config.get(k.EmailAddress.NoReply);
            assert.equal(senderEmailAddress, noreplyEmailAddress);
        });

        it('should not send a confirmation email if a user already has an account linked by another provider', async function() {
            await SpecUtil.deleteAllEmail();
            const language = await db[k.Model.Language].find();
            const authAdapterTypes = await db[k.Model.AuthAdapterType].findAll();
            const user = await db[k.Model.User].create({
                email: credential[k.Attr.Email],
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id)
            });
            const facebookIdentity = await db[k.Model.Identity].create({
                auth_adapter_type_id: _.find(authAdapterTypes, {name: 'facebook'}).get(k.Attr.Id),
                user_id: user.get(k.Attr.Id)
            });

            await request(server).post('/users').send(credential);
            const emails = await SpecUtil.getAllEmail();
            assert.equal(emails.length, 0);
        });

        it('should store the new users password in an encrypted format that is not equal to the request', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.User].find({
                    where: {
                        email: credential.email
                    }
                }).then(function(user) {
                    return db[k.Model.Credential].find({
                        where: {
                            user_id: user.get(k.Attr.Id)
                        }
                    }).then(function(credentialFromDB) {
                        assert.notEqual(credentialFromDB.password, credential.password);
                    });
                });
            });
        });

        it('should create a new VerificationToken record pointing to the newly registered user', function() {
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

        it('should send an email containing the confirmation URL (with the correct VerificationToken token)', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.VerificationToken].find({
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

        it('should send an email from the noreply user', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.VerificationToken].find({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.last(emails).envelope.from.address, config.get(k.EmailAddress.NoReply));
                    });
                });
            });
        });

        it('should send an email to the newly registered user', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.VerificationToken].find({
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

        it('should send an email with the appropriate subject', function() {
            return request(server).post('/users').send(credential).then(function(response) {
                return db[k.Model.VerificationToken].find({
                    where: {
                        user_id: response.body.id
                    }
                }).then(function(token) {
                    return SpecUtil.getAllEmail().then(function(emails) {
                        assert.equal(_.last(emails).subject, i18n.__('welcome.subject'));
                    });
                });
            });
        });
    });
});
