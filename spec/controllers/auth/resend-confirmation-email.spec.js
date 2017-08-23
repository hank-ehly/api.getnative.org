/**
 * resend-confirmation-email.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/19.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const Auth = require('../../../app/services').Auth;
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const chance = require('chance').Chance();
const i18n = require('i18n');
const _ = require('lodash');

describe('POST /resend_confirmation_email', function() {
    let server = null;
    let user = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.startServer().then(function(initGroup) {
            server = initGroup.server;
            db = initGroup.db;

            return db[k.Model.Language].find().then(function(language) {
                return db[k.Model.User].create({
                    default_study_language_id: language.get(k.Attr.Id),
                    interface_language_id: language.get(k.Attr.Id),
                    email: 'test-' + chance.email()
                });
            }).then(function(_user) {
                user = _user.get({plain: true});
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 400 Bad Request if the 'email' body parameter is missing`, function(done) {
            request(server).post('/resend_confirmation_email').expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'email' body parameter is not a string`, function(done) {
            request(server).post('/resend_confirmation_email').send({email: ['not', 'a', 'string']}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'email' body parameter is not a valid email address`, function(done) {
            request(server).post('/resend_confirmation_email').send({email: '@email.com'}).expect(400, done);
        });

        it(`should respond with 404 Not Found if no user with the specified email address exists`, function(done) {
            request(server).post('/resend_confirmation_email').send({email: 'unknown@email.com'}).expect(404, done);
        });

        it(`should contain the appropriate error response object if the user does not exist`, function() {
            return request(server).post('/resend_confirmation_email').send({email: 'unknown@email.com'}).then(function(response) {
                const error = _.first(response.body);
                assert.equal(error.message, i18n.__(`errors.${error.code}`));
            });
        });

        it(`should respond with 422 Unprocessable Entity if the user linked to the specified email address is already confirmed`, function(done) {
            db[k.Model.Language].find().then(function(language) {
                return db[k.Model.User].create({
                    email_verified: true,
                    default_study_language_id: language.get(k.Attr.Id),
                    interface_language_id: language.get(k.Attr.Id),
                    email: 'test-' + chance.email()
                });
            }).then(function(_user) {
                request(server).post('/resend_confirmation_email').send({email: _user.get(k.Attr.Email)}).expect(422, done);
            });
        });

        it(`should contains the appropriate error response object if the user is already confirmed`, function() {
            return db[k.Model.Language].find().then(function(language) {
                return db[k.Model.User].create({
                    email_verified: true,
                    default_study_language_id: language.get(k.Attr.Id),
                    interface_language_id: language.get(k.Attr.Id),
                    email: 'test-' + chance.email()
                });
            }).then(function(_user) {
                return request(server).post('/resend_confirmation_email').send({email: _user.get(k.Attr.Email)});
            }).then(function(response) {
                const error = _.first(response.body);
                assert.equal(error.message, i18n.__(`errors.${error.code}`));
            });
        });
    });

    describe('success', function() {
        it('should respond with 204 No Content if the request succeeds', function() {
            return request(server).post('/resend_confirmation_email').send({email: user.email}).expect(204);
        });

        it('should create a new VerificationToken linked to the user', function() {
            return request(server).post('/resend_confirmation_email').send({email: user.email}).then(function(response) {
                return db[k.Model.VerificationToken].find({where: {user_id: user.id}});
            }).then(function(token) {
                assert(token);
            });
        });

        it('should send an email to the specified address if it is linked to an user', function() {
            return request(server).post('/resend_confirmation_email').send({email: user.email}).then(function() {
                return SpecUtil.getAllEmail().then(function(emails) {
                    const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
                    assert.equal(recipientEmailAddress, user.email);
                });
            });
        });

        it('should send an email containing the confirmation URL (with the correct VerificationToken token)', async function() {
            const response = await request(server).post('/resend_confirmation_email').send({email: user[k.Attr.Email]});
            const tokens = await db[k.Model.VerificationToken].findAll({
                where: {user_id: user[k.Attr.Id]},
                order: [['id', 'DESC']],
                limit: 1
            });
            const emails = await SpecUtil.getAllEmail();
            const expectedURL = `${config.get(k.Client.Protocol)}://${config.get(k.Client.Host)}/confirm_email?token=${_.first(tokens).get(k.Attr.Token)}`;
            assert(_.includes(_.last(emails).html, expectedURL));
        });
    });
});
