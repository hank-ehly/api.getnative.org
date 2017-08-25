/**
 * send-email-update-confirmation-email.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const chance = require('chance').Chance();
const i18n = require('i18n');
const _ = require('lodash');

describe('POST /users/:id/email', function() {
    let server, user, db, auth, body;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login();
        server = results.server;
        db = results.db;
        auth = results.authorization;
        const language = await db[k.Model.Language].find();
        user = await db[k.Model.User].create({
            default_study_language_id: language.get(k.Attr.Id),
            interface_language_id: language.get(k.Attr.Id),
            email: 'test-' + chance.email()
        });
        body = {email: 'test_' + chance.email()};
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the "email" body parameter is missing', function() {
            return request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).expect(400);
        });

        it('should respond with 400 Bad Request if the "email" body parameter is not a string', function() {
            return request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send({email: _.stubObject()}).expect(400);
        });

        it('should respond with 400 Bad Request if the "email" body parameter is not a valid email address', function() {
            return request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send({email: '@email.com'}).expect(400);
        });

        it('should return 400 Bad Request if user_id is not a number', function() {
            return request(server).post(`/users/not_a_number/email`).set(k.Header.Authorization, auth).send(body).expect(400);
        });

        it('should return 400 Bad Request if user_id is 0', function() {
            return request(server).post(`/users/0/email`).set(k.Header.Authorization, auth).send(body).expect(400);
        });

        it('should return 404 Not Found if the user_id does not correspond to an existing User record', async function() {
            return request(server).post(`/users/${Math.pow(10, 5)}/email`).set(k.Header.Authorization, auth).send(body).expect(404);
        });

        it('should contain the appropriate error response object if the user does not exist', async function() {
            const response = await request(server).post(`/users/${Math.pow(10, 5)}/email`).set(k.Header.Authorization, auth).send(body);
            const error = _.first(response.body);
            assert.equal(error.message, i18n.__(`errors.${error.code}`));
        });

        it('should respond with 422 Unprocessable Entity if a user already exists with the specified email address', async function() {
            const language = await db[k.Model.Language].find();

            const _user = await db[k.Model.User].create({
                email_verified: true,
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id),
                email: 'test-' + chance.email()
            });

            return request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send({email: _user.get(k.Attr.Email)}).expect(422);
        });

        it('should contain the appropriate error response object if a user already exists with the specified email address', async function() {
            const language = await db[k.Model.Language].find();

            const _user = await db[k.Model.User].create({
                email_verified: true,
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id),
                email: 'test-' + chance.email()
            });

            const response = await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send({email: _user.get(k.Attr.Email)});
            const error = _.first(response.body);

            assert.equal(error.message, i18n.__(`errors.${error.code}`));
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            assert(_.gt(response.headers[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            assert(SpecUtil.isParsableTimestamp(+response.headers[k.Header.AuthExpire]));
        });

        it('should respond with 204 No Content if the request succeeds', function() {
            return request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body).expect(204);
        });

        it('should create a new VerificationToken linked to the user', async function() {
            const response = await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            const token = await db[k.Model.VerificationToken].find({where: {user_id: user.id}});
            assert(token);
        });

        it('should create a new EmailChangeRequest linked to the verification token', async function() {
            const response = await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            const tokens = await db[k.Model.VerificationToken].findAll({where: {user_id: user.id}, limit: 1, order: [['id', 'DESC']]});
            const emailChangeReq = await db[k.Model.EmailChangeRequest].find({where: {verification_token_id: _.first(tokens).get(k.Attr.Id)}});
            assert(emailChangeReq);
        });

        it('should send an email to the specified address', async function() {
            await SpecUtil.deleteAllEmail();
            await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            const emails = await SpecUtil.getAllEmail();
            const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
            assert.equal(recipientEmailAddress, body.email);
        });

        it('should send an email containing the confirmation URL (with the correct VerificationToken token)', async function() {
            await request(server).post(`/users/${user.get(k.Attr.Id)}/email`).set(k.Header.Authorization, auth).send(body);
            const tokens = await db[k.Model.VerificationToken].findAll({where: {user_id: user.id}, limit: 1, order: [['id', 'DESC']]});
            const emails = await SpecUtil.getAllEmail();
            const expectedURL = `${config.get(k.Client.Protocol)}://${config.get(k.Client.Host)}/confirm_email_update?token=${_.first(tokens).token}`;
            assert(_.includes(_.last(emails).html, expectedURL));
        });
    });
});
