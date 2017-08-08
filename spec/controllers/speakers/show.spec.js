/**
 * show.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/16.
 */

const k = require('../../../config/keys.json');
const Speaker = require('../../../app/models')[k.Model.Speaker];
const SpecUtil = require('../../spec-util');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const url = require('url');
const _ = require('lodash');

describe('GET /speakers/:id', function() {
    let server = null;
    let authorization = null;
    let testSpeaker = null;

    before(function(done) {
        this.timeout(SpecUtil.defaultTimeout);
        SpecUtil.seedAll().then(function() {
            Speaker.find().then(function(speaker) {
                testSpeaker = speaker.toJSON();
                done();
            }).catch(done);
        });
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login();
        server = result.server;
        authorization = result.authorization;
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).expect(401);
        });

        it('should respond with 404 Not Found if the requested speaker does not exist', function() {
            return request(server).get('/speakers/99999999').set('authorization', authorization).expect(404);
        });

        it('should respond with 400 if the provided "lang" query parameter value is not a valid lang code', function() {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).query({lang: 'invalid'}).set('authorization', authorization).expect(400);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(response) {
                assert(response.header[k.Header.AuthToken].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should return a single object', () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isPlainObject(speaker.body));
            });
        });

        it(`should return an object containing the same 'id' value as the URL parameter`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert.equal(speaker.body.id, testSpeaker[k.Attr.Id]);
            });
        });

        it('should return an object containing a string description about the speaker', () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.description));
            });
        });

        it(`should not return a blank 'description'`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.description.length, 0))
            });
        });

        it(`should return an object containing the speaker's string 'name' property`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.name));
            });
        });

        it(`should not return a blank 'name'`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.name.length, 0));
            });
        });

        it(`should return an object containing the speaker's string location`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body.location));
            });
        });

        it(`should not return a blank 'location'`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.gt(speaker.body.location.length, 0));
            });
        });

        it('should contain a gender object', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(_.isPlainObject(response.body.gender));
        });

        it('should contain a gender.id number', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(_.isNumber(response.body.gender[k.Attr.Id]));
        });

        it('should contain a gender.name string', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(_.isString(response.body.gender[k.Attr.Name]));
        });

        it(`should return an object containing the speaker's valid picture url`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isString(speaker.body[k.Attr.PictureUrl]));
            });
        });

        it(`should return an object containing a boolean value denoting whether or not the speaker has chosen to use a custom picture`, () => {
            return request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization).then(function(speaker) {
                assert(_.isBoolean(speaker.body.is_silhouette_picture));
            });
        });

        it('should localize the speaker description based on the lang query parameter if it is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(response.body[k.Attr.Description]));
        });

        it('should localize the speaker description based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(/[a-z]/i.test(response.body[k.Attr.Description]));
        });

        it('should localize the speaker name based on the lang query parameter if it is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(response.body[k.Attr.Name]));
        });

        it('should localize the speaker name based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(/[a-z]/i.test(response.body[k.Attr.Name]));
        });

        it('should localize the speaker location based on the lang query parameter if it is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).query({lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(response.body[k.Attr.Location]));
        });

        it('should localize the speaker location based on the user preferred interface language if no lang query parameter is present', async function() {
            const response = await request(server).get(`/speakers/${testSpeaker[k.Attr.Id]}`).set('authorization', authorization);
            assert(/[a-z]/i.test(response.body[k.Attr.Location]));
        });
    });
});
