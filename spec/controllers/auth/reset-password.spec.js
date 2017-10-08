/**
 * reset-password.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/08/25.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services/auth');

const m = require('mocha');
const [describe, it, before, beforeEach, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.afterEach];
const request = require('supertest');
const moment = require('moment');
const assert = require('assert');
const _ = require('lodash');

describe('POST /reset_password', function() {
    let server, db, user, url = '/reset_password';

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.startServer();
        server = results.server;
        db = results.db;
        user = await db[k.Model.User].find();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        const password = '12345678';

        describe('token', function() {
            describe('is missing', function() {
                it('should respond with a 400 Bad Request status code', function() {
                    return request(server).post(url).send({password: password}).expect(400);
                });

                it('should return an error object with the RequestParam code', async function() {
                    const response = await request(server).post(url).send({password: password});
                    assert.equal(_.first(response.body).code, k.Error.RequestParam);
                });
            });

            describe('is less than 32 characters long', function() {
                it('should respond with a 400 Bad Request status code', function() {
                    return request(server).post(url).send({password: password, token: '12345'}).expect(400);
                });

                it('should return an error object with the RequestParam code', async function() {
                    const response = await request(server).post(url).send({password: password, token: '12345'});
                    assert.equal(_.first(response.body).code, k.Error.RequestParam);
                });
            });

            describe('is more than 32 characters', function() {
                const token = _.times(33, 'x').join('');

                it('should respond with a 400 Bad Request status code', function() {
                    return request(server).post(url).send({password: password, token: token}).expect(400);
                });

                it('should return an error object with the RequestParam code', async function() {
                    const response = await request(server).post(url).send({password: password, token: token});
                    assert.equal(_.first(response.body).code, k.Error.RequestParam);
                });
            });

            describe('does not correspond to an existing VerificationToken', function() {
                const token = 'bf294bed1332e34f9faf00413d0e61ab';

                it('should respond with a 404 Not Found status code', function() {
                    return request(server).post(url).send({password: password, token: token}).expect(404);
                });

                it('should return an error object with the VerificationTokenDoesNotExist code', async function() {
                    const response = await request(server).post(url).send({password: password, token: token});
                    assert.equal(_.first(response.body).code, k.Error.VerificationTokenDoesNotExist);
                });
            });

            describe('is expired', function() {
                let token;

                before(async function() {
                    token = await db[k.Model.VerificationToken].create({
                        user_id: user.get(k.Attr.Id),
                        token: Auth.generateRandomHash(),
                        expiration_date: moment().subtract(1, 'days').toDate()
                    });
                });

                it('should respond with a 422 Unprocessable Entity status code', function() {
                    return request(server).post(url).send({password: password, token: token.get(k.Attr.Token)}).expect(422);
                });

                it('should return an error object with the PasswordResetPeriodExpired code', async function() {
                    const response = await request(server).post(url).send({password: password, token: token.get(k.Attr.Token)});
                    assert.equal(_.first(response.body).code, k.Error.PasswordResetPeriodExpired);
                });
            });

            describe('is verification completed', function() {
                let token;

                before(async function() {
                    token = await db[k.Model.VerificationToken].create({
                        user_id: user.get(k.Attr.Id),
                        token: Auth.generateRandomHash(),
                        expiration_date: moment().add(1, 'days').toDate(),
                        is_verification_complete: true
                    });
                });

                it('should respond with a 422 Unprocessable Entity status code', function() {
                    return request(server).post(url).send({password: password, token: token.get(k.Attr.Token)}).expect(422);
                });

                it('should return an error object with the PasswordResetAlreadyComplete code', async function() {
                    const response = await request(server).post(url).send({password: password, token: token.get(k.Attr.Token)});
                    assert.equal(_.first(response.body).code, k.Error.PasswordResetAlreadyComplete);
                });
            });
        });

        describe('password', function() {
            let token;

            before(async function() {
                token = await db[k.Model.VerificationToken].create({
                    user_id: user.get(k.Attr.Id),
                    token: Auth.generateRandomHash(),
                    expiration_date: moment().add(1, 'days').toDate()
                });
            });

            describe('is missing', function() {
                it('should respond with a 400 Bad Request status code', function() {
                    return request(server).post(url).send({token: token.get(k.Attr.Token)}).expect(400);
                });

                it('should return an error object with the RequestParam code', async function() {
                    const response = await request(server).post(url).send({token: token.get(k.Attr.Token)});
                    assert.equal(_.first(response.body).code, k.Error.RequestParam);
                });
            });

            describe('is less than 8 characters', function() {
                it('should respond with a 400 Bad Request status code', function() {
                    return request(server).post(url).send({password: '1234567', token: token.get(k.Attr.Token)}).expect(400);
                });

                it('should return an error object with the RequestParam code', async function() {
                    const response = await request(server).post(url).send({password: '1234567', token: token.get(k.Attr.Token)});
                    assert.equal(_.first(response.body).code, k.Error.RequestParam);
                });
            });
        });
    });

    describe('success', function() {
        it('should send a confirmation email to the user', async function() {
            let token, user, credential, password = '12345678';

            const englishId = await db[k.Model.Language].findIdForCode('en');

            user = await db[k.Model.User].create({
                email: Auth.generateRandomHash() + '@test.com',
                default_study_language_id: englishId,
                interface_language_id: englishId
            });

            credential = await db[k.Model.Credential].create({
                user_id: user.get(k.Attr.Id),
                password: password
            });

            token = await db[k.Model.VerificationToken].create({
                user_id: user.get(k.Attr.Id),
                token: Auth.generateRandomHash(),
                expiration_date: moment().add(1, 'days').toDate()
            });

            await SpecUtil.deleteAllEmail();
            await request(server).post(url).send({password: password, token: token.get(k.Attr.Token)});
            const allEmails = await SpecUtil.getAllEmail();
            const mostRecentEmail = _.last(allEmails);
            const recipient = _.first(mostRecentEmail.envelope.to).address;
            assert.equal(recipient, user.get(k.Attr.Email));
        });

        it('should update the verification_token.is_verification_complete to true', async function() {
            let token, user, password = '12345678';

            const englishId = await db[k.Model.Language].findIdForCode('en');

            user = await db[k.Model.User].create({
                email: Auth.generateRandomHash() + '@test.com',
                default_study_language_id: englishId,
                interface_language_id: englishId
            });

            await db[k.Model.Credential].create({
                user_id: user.get(k.Attr.Id),
                password: password
            });

            token = await db[k.Model.VerificationToken].create({
                user_id: user.get(k.Attr.Id),
                token: Auth.generateRandomHash(),
                expiration_date: moment().add(1, 'days').toDate()
            });

            await request(server).post(url).send({password: password, token: token.get(k.Attr.Token)});
            const updatedToken = await db[k.Model.VerificationToken].find({where: {token: token.get(k.Attr.Token)}});

            assert(updatedToken.get('is_verification_complete'));
        });

        describe('the user has no password yet', function() {
            let token, user, password = '12345678';

            before(async function() {
                const englishId = await db[k.Model.Language].findIdForCode('en');

                user = await db[k.Model.User].create({
                    email: Auth.generateRandomHash() + '@test.com',
                    default_study_language_id: englishId,
                    interface_language_id: englishId
                });

                token = await db[k.Model.VerificationToken].create({
                    user_id: user.get(k.Attr.Id),
                    token: Auth.generateRandomHash(),
                    expiration_date: moment().add(1, 'days').toDate()
                });
            });

            it('should create a Credential record with the new password value for the user', async function() {
                await request(server).post(url).send({password: password, token: token.get(k.Attr.Token)});
                const credential = await db[k.Model.Credential].find({where: {user_id: user.get(k.Attr.Id)}});
                assert(Auth.verifyPassword(credential.get(k.Attr.Password), password));
            });
        });

        describe('the user already has a password', function() {
            let token, user, credential, password = '12345678';

            before(async function() {
                const englishId = await db[k.Model.Language].findIdForCode('en');

                user = await db[k.Model.User].create({
                    email: Auth.generateRandomHash() + '@test.com',
                    default_study_language_id: englishId,
                    interface_language_id: englishId
                });

                credential = await db[k.Model.Credential].create({
                    user_id: user.get(k.Attr.Id),
                    password: password
                });

                token = await db[k.Model.VerificationToken].create({
                    user_id: user.get(k.Attr.Id),
                    token: Auth.generateRandomHash(),
                    expiration_date: moment().add(1, 'days').toDate()
                });
            });

            it('should update the users password to the hashed new password value', async function() {
                const drowssap = _.reverse(password.split('')).join('');
                await request(server).post(url).send({password: drowssap, token: token.get(k.Attr.Token)});
                await credential.reload();
                assert(Auth.verifyPassword(credential.get(k.Attr.Password), drowssap));
            });
        });
    });
});
