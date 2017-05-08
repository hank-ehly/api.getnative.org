/**
 * show.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/20.
 */

const SpecUtil = require('../../spec-util');
const Utility  = require('../../../app/services').Utility;

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /videos/:id', function() {
    let server         = null;
    let authorization  = null;
    let user           = null;
    let id = null;
    let db             = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initGroup) {
            server = initGroup.server;
            db = initGroup.db;
            authorization = initGroup.authorization;
            user = initGroup.response.body;

            return db.sequelize.query('SELECT id FROM videos LIMIT 1').spread(r => {
                id = _.first(r).id;
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get(`/videos/${id}`).expect(401, done);
        });

        it(`should return a 400 Bad Request response if the :id parameter is not an integer`, function(done) {
            request(server).get('/videos/notAnInteger').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the :id parameter is 0`, function(done) {
            request(server).get('/videos/0').set('authorization', authorization).expect(400, done);
        });
    });

    describe('response.success', function() {
        it(`should return a 200 OK response given a valid request`, function(done) {
            request(server).get(`/videos/${id}`).set('authorization', authorization).expect(200, done);
        });

        it(`should contain a non-null 'cued' boolean`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isBoolean(response.body.cued));
            });
        });

        it(`should contain a non-null 'description' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(response.body.description));
            });
        });

        it(`should contain a non-null 'id' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.id));
            });
        });

        it(`should contain a non-null 'speaker' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(response.body.speaker));
            });
        });

        it(`should contain a non-null 'speaker.id' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.speaker.id));
            });
        });

        it(`should contain a non-null 'speaker.description' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(response.body.speaker.description));
            });
        });

        it(`should contain a non-null 'speaker.name' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(response.body.speaker.name));
            });
        });

        it(`should contain a non-null 'speaker.picture_url' url string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(response.body.speaker.picture_url));
            });
        });

        it(`should contain a non-null 'subcategory' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(response.body.subcategory));
            });
        });

        it(`should contain a non-null 'subcategory.id' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.subcategory.id));
            });
        });

        it(`should contain a non-null 'subcategory.name' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(response.body.subcategory.name));
            });
        });

        it(`should contain a non-null 'loop_count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.loop_count));
            });
        });

        it(`should contain a non-null 'picture_url' url string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(response.body.picture_url));
            });
        });

        it(`should contain a non-null 'video_url' url string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(response.body.video_url));
            });
        });

        it(`should contain a valid 'language_code' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                // todo: compare against set list of lang codes
                assert(_.includes(['en', 'ja'], response.body.language_code));
            });
        });

        it(`should contain a non-null 'related_videos' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(response.body.related_videos));
            });
        });

        it(`should contain a non-null 'related_videos.records' array`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isArray(response.body.related_videos.records));
            });
        });

        it(`should contain a non-null 'related_videos.count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.related_videos.count));
            });
        });

        it(`related_videos.records.length and related_videos.count should be equal`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.related_videos.records.length, response.body.related_videos.count);
            });
        });

        it(`should return at most 3 related videos`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.lte(response.body.related_videos.count, 3));
                assert(_.lte(response.body.related_videos.records.length, 3));
            });
        });

        it(`should return related videos whose 'created_at' property is a client-friendly datetime string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.related_videos.records).created_at));
            });
        });

        it(`should apply the timezone offset in the request to related videos 'created_at'`, function() {
            return request(server).get(`/videos/${id}?time_zone_offset=-540`).set('authorization', authorization).then(function(response) {
                const timeZoneOffset = _.first(response.body.related_videos.records).created_at.split(' ')[4];
                assert.equal('+0900', timeZoneOffset);
            });
        });

        it(`should contains a non-null 'related_videos.records[N].cued boolean`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isBoolean(_.first(response.body.related_videos.records).cued));
            });
        });

        it(`should contains a non-null 'related_videos.records[N].picture_url url string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(_.first(response.body.related_videos.records).picture_url));
            });
        });

        it(`should return related videos whose category is the same as the video being shown`, function() {
            const expectedSubcategoryIds = db.sequelize.query(`
                SELECT id FROM subcategories WHERE category_id IN (
                    SELECT category_id FROM subcategories WHERE id = (
                        SELECT subcategory_id FROM videos WHERE id = ?
                    )
                )
            `, {replacements: [id]}).spread(function(results) {
                return _.map(results, 'id');
            });

            const actualSubcategoryIds = request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                return _.map(response.body.related_videos.records, 'subcategory.id');
            });

            return Promise.join(expectedSubcategoryIds, actualSubcategoryIds, function(expected, actual) {
                assert.equal(_.difference(actual, expected).length, 0);
            });
        });

        it(`should return different related videos if the same video is requested twice`, function() {
            const r1 = request(server).get(`/videos/${id}`).set('authorization', authorization);
            const r2 = request(server).get(`/videos/${id}`).set('authorization', authorization);
            return Promise.join(r1, r2, function(first, second) {
                assert(!_.isEqual(first.body.related_videos, second.body.related_videos));
            });
        });

        it(`should contain a non-null 'like_count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.like_count));
            });
        });

        it(`should contain a non-null 'liked' boolean`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isBoolean(response.body.liked));
            });
        });

        it(`should contain a non-null 'length' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.length));
            });
        });

        it(`should contain a non-null 'transcripts' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(response.body.transcripts));
            });
        });

        it(`should contain a non-null 'transcripts.records' array`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isArray(response.body.transcripts.records));
            });
        });

        it(`should contain a non-null 'transcripts.count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.transcripts.count));
            });
        });

        it(`transcripts.records.length and transcripts.count should be equal`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.transcripts.records.length, response.body.transcripts.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].text' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.transcripts.records).text));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].language_code' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.transcripts.records).language_code));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.transcripts.records).collocations));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records' array`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isArray(_.first(response.body.transcripts.records).collocations.records));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.transcripts.records).collocations.count));
            });
        });

        it(`collocations.records.length and collocations.count should be equal`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert.equal(_.first(response.body.transcripts.records).collocations.records.length,
                    _.first(response.body.transcripts.records).collocations.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].text' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.transcripts.records).collocations.count));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].description' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(_.first(response.body.transcripts.records).collocations.records).description));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].ipa_spelling' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(_.first(response.body.transcripts.records).collocations.records).ipa_spelling));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].usage_examples' object`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(_.first(_.first(response.body.transcripts.records).collocations.records).usage_examples));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].usage_examples.records' array`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isArray(_.first(_.first(response.body.transcripts.records).collocations.records).usage_examples.records));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].usage_examples.count' integer`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(_.first(response.body.transcripts.records).collocations.records).usage_examples.count));
            });
        });

        it(`usage_examples.records.length should be equal to usage_examples.count`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert.equal(_.first(_.first(response.body.transcripts.records).collocations.records).usage_examples.records.length,
                    _.first(_.first(response.body.transcripts.records).collocations.records).usage_examples.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocations.records[N].usage_examples.records[N].text' string`, function() {
            return request(server).get(`/videos/${id}`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(_.first(_.first(response.body.transcripts.records).collocations.records).usage_examples.records).text));
            });
        });
    });
});
