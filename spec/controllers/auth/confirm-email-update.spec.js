/**
 * confirm-email-update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

const SpecUtil = require('../../spec-util');
const Auth = require('../../../app/services/auth');
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services/utility');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const moment = require('moment');
const chance = require('chance').Chance();
const _ = require('lodash');
const util = require('util');

describe('POST /confirm_email_update', function() {
    let server, body, user, db, languages, newEmail, oldEmail;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.startServer();
        server = results.server;
        db = results.db;

        if (!languages) {
            languages = await db[k.Model.Language].findAll({attributes: [k.Attr.Id]});
        }

        const language = _.sample(languages);
        oldEmail = 'test-' + chance.email();
        user = await db[k.Model.User].create({
            default_study_language_id: language.get(k.Attr.Id),
            interface_language_id: language.get(k.Attr.Id),
            email: oldEmail
        });

        const token = await db[k.Model.VerificationToken].create({
            user_id: user.id,
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        });

        newEmail = 'test-' + chance.email();

        const emailChangeRequest = await db[k.Model.EmailChangeRequest].create({
            email: newEmail,
            verification_token_id: token.get(k.Attr.Id)
        });

        body = {token: token.get(k.Attr.Token)};
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if the "token" body parameter is missing', function() {
            return request(server).post('/confirm_email_update').expect(400);
        });

        it('should respond with 400 Bad Request if the "token" body parameter is less than 32 characters in length', function() {
            return request(server).post('/confirm_email_update').send({token: 'less_than_32_characters'}).expect(400);
        });

        it('should respond with 400 Bad Request if the "token" body parameter is more than 32 characters in length', function() {
            return request(server).post('/confirm_email_update').send('more_than_32_characters_more_than_32_characters').expect(400);
        });

        it('should respond with 404 Not Found if the verification token does not exist', function() {
            return request(server).post('/confirm_email_update').send({token: 'bf294bed1332e34f9faf00413d0e61ab'}).expect(404);
        });

        it('should respond with 422 Unprocessable Entity if the verification token is expired', async function() {
            const _token = await db[k.Model.VerificationToken].create({
                user_id: user.id,
                token: Auth.generateRandomHash(),
                expiration_date: moment().subtract(1, 'days').toDate()
            });

            return request(server).post('/confirm_email_update').send({token: _token.get(k.Attr.Token)}).expect(422);
        });

        it('should respond with 422 Unprocessable Entity if the verification token is_verification_complete is true', async function() {
            const _token = await db[k.Model.VerificationToken].create({
                user_id: user.id,
                token: Auth.generateRandomHash(),
                expiration_date: moment().add(1, 'days').toDate(),
                is_verification_complete: true
            });

            return request(server).post('/confirm_email_update').send({token: _token.get(k.Attr.Token)}).expect(422);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.gt(response.headers[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(SpecUtil.isParsableTimestamp(+response.headers[k.Header.AuthExpire]));
        });

        it(`should respond with 200 OK if the email update succeeds`, function() {
            return request(server).post('/confirm_email_update').send(body).expect(200);
        });

        it('should respond with an object containing the user ID', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should respond with an object containing the user email address', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(SpecUtil.isValidEmail(response.body[k.Attr.Email]));
        });

        it('should respond with an object containing the user preference for receiving browser notifications', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isBoolean(response.body[k.Attr.BrowserNotificationsEnabled]));
        });

        it(`should not include the user password in the response`, async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(!response.body[k.Attr.Password]);
        });

        it('should respond with an object containing the user preference for receiving email notifications', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isBoolean(response.body[k.Attr.EmailNotificationsEnabled]));
        });

        it('should respond with an object containing the user email validity status', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isBoolean(response.body[k.Attr.EmailVerified]));
        });

        it('should respond with an object containing a top level default_study_language object', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isPlainObject(response.body[k.Attr.DefaultStudyLanguage]));
        });

        it('should respond with an object containing a top level default_study_language.name string', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isString(response.body[k.Attr.DefaultStudyLanguage][k.Attr.Name]));
        });

        it('should respond with an object containing a top level default_study_language.code string', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isString(response.body[k.Attr.DefaultStudyLanguage][k.Attr.Code]));
        });

        it('should respond with an object containing the user profile picture URL', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isString(response.body[k.Attr.PictureUrl]));
        });

        it('should respond with an object containing the user preference for using the profile picture or silhouette image', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert(_.isBoolean(response.body[k.Attr.IsSilhouettePicture]));
        });

        it('should update the user email address to the specified address', async function() {
            const response = await request(server).post('/confirm_email_update').send(body);
            assert.equal(response.body[k.Attr.Email], newEmail);
        });

        it('should send a confirmation email to the new email address', async function() {
            await SpecUtil.deleteAllEmail();

            await request(server).post('/confirm_email_update').send(body);
            const emails = await SpecUtil.getAllEmail();

            const email = _.find(emails, function(value) {
                return _.find(value.envelope.to, {address: newEmail});
            });

            assert(email);
        });

        it('should send a notification email to the previous user email', async function() {
            await request(server).post('/confirm_email_update').send(body);
            const emails = await SpecUtil.getAllEmail();

            const email = _.find(emails, function(value) {
                return _.find(value.envelope.to, {address: oldEmail});
            });

            assert(email);
        });

        it('should update the verification_token.is_verification_complete to true', async function() {
            await request(server).post('/confirm_email_update').send(body);
            const updatedToken = await db[k.Model.VerificationToken].find({where: {token: body.token}});
            assert(updatedToken.get('is_verification_complete'));
        });
    });
});
