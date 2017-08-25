/**
 * send-password-reset-link.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/08/25.
 */

const k = require('../../../config/keys.json');
const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;

const assert = require('assert');
const request = require('supertest');
const Auth = require('../../../app/services/auth');
const m = require('mocha');
const [describe, it, before, beforeEach, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.afterEach];
const _ = require('lodash');

describe('POST /send_password_reset_link', function() {
    let user, server, db, url = '/send_password_reset_link';

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
        describe('no email was provided', function() {
            it('should respond with 400 Bad Request status code', function() {
                return request(server).post(url).expect(400);
            });

            it('should return an error object with the RequestParam code', async function() {
                const response = await request(server).post(url);
                assert.equal(_.first(response.body).code, k.Error.RequestParam);
            });
        });

        describe('a syntactically invalid email address was provided', function() {
            it('should respond with 400 Bad Request status code', function() {
                return request(server).post(url).send({email: 'bad_value'}).expect(400);
            });

            it('should return an error object with the RequestParam code', async function() {
                const response = await request(server).post(url).send({email: 'bad_value'});
                assert.equal(_.first(response.body).code, k.Error.RequestParam);
            });
        });

        describe('the provided email address does not correspond to an existing account', function() {
            it('should respond with 404 Not Found status code', function() {
                return request(server).post(url).send({email: 'nota@registereduser.com'}).expect(404);
            });

            it('should return an error object with the UserDoesNotExist code', async function() {
                const response = await request(server).post(url).send({email: 'nota@registereduser.com'});
                assert.equal(_.first(response.body).code, k.Error.UserDoesNotExist);
            });
        });
    });

    describe('success', function() {
        it('should send an email to the provided email address', async function() {
            await SpecUtil.deleteAllEmail();
            await request(server).post(url).send({email: user.get(k.Attr.Email)});
            const allEmails = await SpecUtil.getAllEmail();
            const mostRecentEmail = _.last(allEmails);
            const recipientEmailAddress = _.first(mostRecentEmail.envelope.to).address;
            assert.equal(recipientEmailAddress, user.get(k.Attr.Email));
        });

        it('should include the password reset link with the correct verification token in the email', async function() {
            await SpecUtil.deleteAllEmail();
            await request(server).post(url).send({email: user.get(k.Attr.Email)});
            const allEmails = await SpecUtil.getAllEmail();
            const mostRecentEmail = _.last(allEmails);
            const tokenObjArr = await db[k.Model.VerificationToken].findAll({
                where: {user_id: user.get(k.Attr.Id)},
                order: [[k.Attr.Id, 'DESC']],
                limit: 1
            });
            const token = _.first(tokenObjArr).get(k.Attr.Token);
            const expectedURL = Auth.generateConfirmationURLForTokenWithPath(token, 'reset_password');
            assert(_.includes(mostRecentEmail.html, expectedURL));
        });
    });
});
