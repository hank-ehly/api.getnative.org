/**
 * show.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/16.
 */

const Speaker  = require('../../../app/models').Speaker;
const SpecUtil = require('../../spec-util');

const request  = require('supertest');
const Promise  = require('bluebird');
const assert   = require('assert');
const url      = require('url');
const _        = require('lodash');

describe('GET /speakers/:id', function() {
    let server        = null;
    let authorization = null;
    let testSpeaker   = null;

    before(function(done) {
        this.timeout(SpecUtil.defaultTimeout);
        Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]).then(function() {
            Speaker.findOne().then(function(speaker) {
                testSpeaker = speaker.toJSON();
                done();
            }).catch(done);
        });
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server        = _.server;
            authorization = _.authorization;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get(`/speakers/${testSpeaker.id}`).expect(401, done);
        });
    });

    describe('response.success', function() {
        it('should return a single object', () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isPlainObject(speaker.body));
            });
        });

        it(`should return an object containing the same 'id' value as the URL parameter`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert.equal(speaker.body.id, testSpeaker.id);
            });
        });

        it('should return an object containing a string description about the speaker', () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.description));
            });
        });

        it(`should not return a blank 'description'`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.description.length, 0))
            });
        });

        it(`should return an object containing the speaker's string 'name' property`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.name));
            });
        });

        it(`should not return a blank 'name'`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.name.length, 0));
            });
        });

        it(`should return an object containing the speaker's string location`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.location));
            });
        });

        it(`should not return a blank 'location'`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.location.length, 0));
            });
        });

        it(`should return an object containing the speaker's valid picture url`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                let parsedURL = url.parse(speaker.body.picture_url);
                assert(parsedURL.protocol);
                assert(parsedURL.hostname);
            });
        });

        it(`should return an object containing a boolean value denoting whether or not the speaker has chosen to use a custom picture`, () => {
            return request(server).get(`/speakers/${testSpeaker.id}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isBoolean(speaker.body.is_silhouette_picture));
            });
        });
    });
});
