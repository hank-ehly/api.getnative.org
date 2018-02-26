/**
 * login.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/08.
 */

const Utility = require('../../../app/services')['Utility'];
const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /sessions', function() {
    let server = null;
    let response = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        const results = await SpecUtil.login();
        server = results.server;
        response = results.response;
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            assert(response.headers[k.Header.AuthToken].length > 0);
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            assert(SpecUtil.isParsableTimestamp(+response.headers[k.Header.AuthExpire]));
        });
    });

    describe('failure', function() {
        it('should respond with a 404 Not Found response if the user is not found', function(done) {
            request(server).post('/sessions').send({
                email: 'bad@email.com',
                password: SpecUtil.credentials.password
            }).expect(404, done);
        });

        it(`should respond with a 404 Not Found if the provided login password is incorrect`, function(done) {
            request(server).post('/sessions').send({
                email: SpecUtil.credentials.email,
                password: 'incorrect'
            }).expect(404, done);
        });
    });

    describe('success', function() {
        it('should respond with 201 Created', function(done) {
            request(server).post('/sessions').send(SpecUtil.credentials).expect(201, done);
        });

        it('should respond with an object containing the user\'s ID', function() {
            assert(_.isNumber(response.body[k.Attr.Id]));
        });

        it('should respond with an object containing the user\'s email address', function() {
            assert(SpecUtil.isValidEmail(response.body[k.Attr.Email]));
        });

        it('should respond with an object containing the user\'s preference for receiving browser notifications', function() {
            assert(_.isBoolean(response.body[k.Attr.BrowserNotificationsEnabled]));
        });

        it(`should not include the user password in the response`, function() {
            assert(!response.body[k.Attr.Password]);
        });

        it('should respond with an object containing the user\'s preference for receiving email notifications', function() {
            assert(_.isBoolean(response.body[k.Attr.EmailNotificationsEnabled]));
        });

        it('should respond with an object containing the user\'s email validity status', function() {
            assert(_.isBoolean(response.body[k.Attr.EmailVerified]));
        });

        it('should respond with an object containing a top level default_study_language object', function() {
            assert(_.isPlainObject(response.body[k.Attr.DefaultStudyLanguage]));
        });

        it('should respond with an object containing a top level default_study_language.name string', function() {
            assert(_.isString(response.body[k.Attr.DefaultStudyLanguage].name));
        });

        it('should respond with an object containing a top level default_study_language.code string', function() {
            assert(_.isString(response.body[k.Attr.DefaultStudyLanguage].code));
        });

        it('should respond with an object containing a top level interface_language object', function() {
            assert(_.isPlainObject(response.body[k.Attr.InterfaceLanguage]));
        });

        it('should respond with an object containing a top level interface_language.name string', function() {
            assert(_.isString(response.body[k.Attr.InterfaceLanguage].name));
        });

        it('should respond with an object containing a top level interface_language.code string', function() {
            assert(_.isString(response.body[k.Attr.InterfaceLanguage].code));
        });

        it('should respond with an object containing the user\'s profile picture URL', function() {
            assert(_.isString(response.body[k.Attr.PictureUrl]));
        });

        it('should respond with an object containing the user\'s preference for using the profile picture or silhouette image', function() {
            assert(_.isBoolean(response.body[k.Attr.IsSilhouettePicture]));
        });
    });
});
