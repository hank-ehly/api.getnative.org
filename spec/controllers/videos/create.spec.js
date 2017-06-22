/**
 * create.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/22.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');

describe('POST /videos', function() {
    let authorization = null;
    let server = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('failure', function() {
        describe('subcategory_id', function() {
            it('should return 400 Bad Request if subcategory_id is not present');
            it('should return 400 Bad Request if subcategory_id is not a number');
            it('should return 400 Bad Request if subcategory_id is 0');
            it('should return 404 Not Found if the subcategory_id does not correspond to an existing Subcategory record');
        });

        describe('language_id', function() {
            it('should return 400 Bad Request if language_id is not present');
            it('should return 400 Bad Request if language_id is not a number');
            it('should return 400 Bad Request if language_id is 0');
            it('should return 404 Not Found if the language_id does not correspond to an existing Language record');
        });

        describe('speaker_id', function() {
            it('should return 400 Bad Request if speaker_id is not present');
            it('should return 400 Bad Request if speaker_id is not a number');
            it('should return 400 Bad Request if speaker_id is 0');
            it('should return 404 Not Found if the speaker_id does not correspond to an existing Speaker record');
        });

        describe('description', function() {
            it('should return 400 Bad Request if description is not present');
            it('should return 400 Bad Request if description is not a string');
            it('should return 400 Bad Request if description is 0 length');
        });

        describe('transcripts', function() {
            it('should return 400 Bad Request if transcripts is not present');
            it('should return 400 Bad Request if transcripts is not an array');
            it('should return 400 Bad Request if transcripts is 0 length');
        });

        describe('transcripts.language_id', function() {
            it('should return 400 Bad Request if transcripts.language_id is not present');
            it('should return 400 Bad Request if transcripts.language_id is not a number');
            it('should return 400 Bad Request if transcripts.language_id is 0');
            it('should return 404 Not Found if the transcripts.language_id does not correspond to an existing Language record');
        });

        describe('transcripts.text', function() {
            it('should return 400 Bad Request if transcripts.text is not present');
            it('should return 400 Bad Request if transcripts.text is not a string');
            it('should return 400 Bad Request if transcripts.text is 0 length');
        });
    });

    describe('success', function() {
        describe('request headers', function() {
            it('should respond with an X-GN-Auth-Token header');
            it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value');
            it('should respond with 201 Created for a valid request');
        });

        describe('data integrity', function() {
            it('should create a new Video record');
            it('should create a new Video with the specified subcategory_id');
            it('should create a new Video with the specified language_id');
            it('should create a new Video with the specified speaker_id');
            it('should create a new Video with the specified description');
            it('should create a new Video with the specified number of transcripts');
            it('should create the same number of new collocation records as specified in the combined transcript text');
        });

        describe('assets storage', function() {
            it('should save a new video asset to online storage');
            it('should save a new picture asset to online storage');
        });
    });
});
