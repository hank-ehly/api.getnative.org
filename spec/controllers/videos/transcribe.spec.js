/**
 * transcribe.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/22.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const assert = require('assert');
const k = require('../../../config/keys.json');
const _ = require('lodash');

const mocha = require('mocha');
const before = mocha.before;
const after = mocha.after;
const afterEach = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const describe = mocha.describe;
const it = mocha.it;
const path = require('path');
const Promise = require('bluebird');

describe('POST /videos/transcribe', function() {
    let authorization = null;
    let server = null;
    let file = path.resolve(__dirname, '..', '..', 'fixtures', 'empty.txt');
    let url = '/videos/transcribe';
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        let results   = await SpecUtil.login(true);
        authorization = results.authorization;
        server        = results.server;
        db            = results.db;
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if no file is present', function(done) {
            request(server).post(url).set('authorization', authorization).expect(400, done);
        });

        it('should respond with 404 Not Found if the authenticated user is not an admin', function(done) {
            this.timeout(SpecUtil.defaultTimeout);

            server.close(async function() {
                let results   = await SpecUtil.login();
                authorization = results.authorization;
                server        = results.server;

                request(server).post(url).set('authorization', authorization).attach('file', file).expect(404, done);
            });
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post(url).set('authorization', authorization).attach('file', file).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post(url).set('authorization', authorization).attach('file', file).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should respond with 200 OK for a successful request', function(done) {
            request(server).post(url).set('authorization', authorization).attach('file', file).expect(200, done);
        });

        it('should return a JSON object', function() {
            return request(server).post(url).set('authorization', authorization).attach('file', file).then(function(response) {
                assert(_.isPlainObject(response.body));
            });
        });

        it(`should return a top-level 'transcription' string`, function() {
            return request(server).post(url).set('authorization', authorization).attach('file', file).then(function(response) {
                assert(_.isString(response.body.transcription));
            });
        });

        it('should return the spoken text', function() {
            return request(server).post(url).set('authorization', authorization).attach('file', file).then(function(response) {
                assert.equal(response.body.transcription, 'test-result');
            });
        });
    });
});
