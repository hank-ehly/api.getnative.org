/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/04.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('PATCH /users', function() {
    let authorization = null;
    let server = null;
    let user = null;
    let db = null;

    const context = {
        email_notifications_enabled: false,
        browser_notifications_enabled: false,
        default_study_language_id: 0,
        interface_language_id: 0
    };

    const validBody = {email_notifications_enabled: true};

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login();
        authorization = results.authorization;
        server = results.server;
        user = results.response.body;
        db = results.db;

        const language = await db[k.Model.Language].find({
            where: {
                code: 'en'
            },
            attributes: [
                k.Attr.Id
            ]
        });

        context.default_study_language_id = context.interface_language_id = language.get(k.Attr.Id);

        return db[k.Model.User].update(context, {
            where: {
                id: user[k.Attr.Id]
            }
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).patch('/users').set('authorization', authorization).send(validBody).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).patch('/users').set('authorization', authorization).send(validBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it(`should return 204 No Content for a valid request`, function(done) {
            request(server).patch('/users').set('authorization', authorization).send(validBody).expect(204, done);
        });

        it(`should respond with 304 Not Modified if the request can authenticate but contains no body`, function(done) {
            request(server).patch('/users').set('authorization', authorization).expect(304, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).patch('/users').set('authorization', authorization).send(validBody).then(function(response) {
                // superagent returns {} if the body is undefined, so we must check for that
                // behind the scenes: this.body = res.body !== undefined ? res.body : {};
                assert.equal(_.size(response.body), 0);
            });
        });

        it(`should change the users' email_notifications_enabled setting`, function() {
            return request(server).patch('/users').set('authorization', authorization).send({email_notifications_enabled: true})
                .then(function() {
                    return db[k.Model.User].findByPrimary(user.id).then(function(_user) {
                        assert.equal(_user.email_notifications_enabled, true);
                    });
                });
        });

        it(`should change the users' browser_notifications_enabled setting`, function() {
            return request(server).patch('/users').send({browser_notifications_enabled: true}).set('authorization', authorization)
                .then(function() {
                    return db[k.Model.User].findByPrimary(user.id).then(function(_user) {
                        assert.equal(_user.browser_notifications_enabled, true);
                    });
                });
        });

        it(`should change the users' default_study_language_id setting`, function() {
            return db[k.Model.Language].find({
                where: {code: 'ja'},
                attributes: [k.Attr.Id]
            }).then(function(language) {
                return request(server).patch('/users').set('authorization', authorization).send({
                    default_study_language_code: 'ja'
                }).then(function() {
                    return db[k.Model.User].findByPrimary(user[k.Attr.Id]).then(function(_user) {
                        assert.equal(_user.default_study_language_id, language[k.Attr.Id]);
                    });
                });
            });
        });

        it(`should change the users interface_language_id`, async function() {
            const language = await db[k.Model.Language].find({
                where: {code: 'ja'},
                attributes: [k.Attr.Id]
            });

            await request(server).patch('/users').set('authorization', authorization).send({
                interface_language_code: 'ja'
            });

            const __user = await db[k.Model.User].findByPrimary(user[k.Attr.Id]);

            assert.equal(__user.get('interface_language_id'), language.get(k.Attr.Id));
        });
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).patch('/users').send(validBody).expect(401, done);
        });

        it(`should return 400 Bad Request if the email_notifications_enabled request parameter is not a boolean`, function(done) {
            request(server).patch('/users').set('authorization', authorization).send({
                email_notifications_enabled: 'not_a_boolean'
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the browser_notifications_enabled request parameter is not a boolean`, function(done) {
            request(server).patch('/users').set('authorization', authorization).send({
                browser_notifications_enabled: 'not_a_boolean'
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the default_study_language_code request parameter is not valid`, function(done) {
            request(server).patch('/users').set('authorization', authorization).send({
                default_study_language_code: 'not_a_lang_code'
            }).expect(400, done);
        });

        it(`should return 400 Bad Request if the interface_language_code request parameter is not valid`, function(done) {
            request(server).patch('/users').set('authorization', authorization).send({
                interface_language_code: 'not_a_lang_code'
            }).expect(400, done);
        });
    });
});
