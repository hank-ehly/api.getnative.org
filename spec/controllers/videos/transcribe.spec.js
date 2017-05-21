/**
 * transcribe.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/22.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

const mocha = require('mocha');
const before = mocha.before;
const after = mocha.after;
const afterEach = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const describe = mocha.describe;
const it = mocha.it;
const path = require('path');

describe('POST /videos/transcribe', function() {
    let authorization = null;
    let server = null;
    let file = path.resolve(__dirname, '..', '..', 'fixtures', 'empty.txt');
    let url = '/videos/transcribe';

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.startMailServer();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(results) {
            authorization = results.authorization;
            server        = results.server;
        });
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.stopMailServer();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if no file is present', function(done) {
            request(server).post(url).set('authorization', authorization).expect(400, done);
        });
    });

    describe('success', function() {
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
