/**
 * show.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/20.
 */

const SpecUtil = require('../../spec-util');
const Utility  = require('../../../app/services/utility');
const k        = require('../../../config/keys.json');
const youtube  = require('../../../app/services/youtube');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /videos/:id', function() {
    let authorization, videoId, server, user, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);

        youtube.videosList = function(idx) {
            return Promise.resolve({
                items: _.times(idx.length, _.constant({
                    id: 'ri6Pip_w6HM',
                    contentDetails: {duration: 'PT1M3S'},
                    statistics: {viewCount: '13438'},
                    snippet: {description: 'test description'}
                }))
            });
        };

        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const result = await SpecUtil.login();
        authorization = result.authorization;
        server = result.server;
        user = result.response.body;
        db = result.db;
        const values = await db.sequelize.query('SELECT id FROM videos LIMIT 1');
        const [rows] = values;
        videoId = _.first(rows)[k.Attr.Id];
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should return a 400 Bad Request response if the :id parameter is not an integer`, function(done) {
            request(server).get('/videos/notAnInteger').set(k.Header.Authorization, authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the :id parameter is 0`, function(done) {
            request(server).get('/videos/0').set(k.Header.Authorization, authorization).expect(400, done);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header if authorized', function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should not respond with an X-GN-Auth-Token header if unauthorized', function() {
            return request(server).get(`/videos/${videoId}`).then(function(response) {
                assert(!response.header[k.Header.AuthToken]);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value if authorized', function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should not respond with an X-GN-Auth-Expire header if unauthorized', function() {
            return request(server).get(`/videos/${videoId}`).then(function(response) {
                assert(!response.header[k.Header.AuthExpire]);
            });
        });

        it(`should return a 200 OK response given a valid request if authorized`, function(done) {
            request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).expect(200, done);
        });

        it(`should return a 200 OK response given a valid request if unauthorized`, function(done) {
            request(server).get(`/videos/${videoId}`).expect(200, done);
        });

        it(`should contain a non-null 'cued' boolean if authorized`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isBoolean(response.body.cued));
            });
        });

        it(`should not contain a non-null 'cued' boolean if unauthorized`, function() {
            return request(server).get(`/videos/${videoId}`).then(function(response) {
                assert(!_.has(response.body, 'cued'));
            });
        });

        it(`should contain a non-null 'description' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(response.body.description));
            });
        });

        it(`should contain a non-null 'youtube_video_id' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(response.body.youtube_video_id));
            });
        });

        it(`should contain a non-null 'id' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.id));
            });
        });

        it('should not contain an "is_public" boolean by default', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization);
            assert(!_.has(response.body), k.Attr.IsPublic);
        });

        it('should contain an "is_public" boolean if the user is an admin', function(done) {
            this.timeout(SpecUtil.defaultTimeout);
            server.close(function() {
                SpecUtil.login(true).then(function(result) {
                    authorization = result.authorization;
                    server = result.server;
                    request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                        assert(_.isBoolean(response.body[k.Attr.IsPublic]));
                        done();
                    }).catch(done);
                }).catch(done);
            });
        });

        it(`should contain a non-null 'speaker' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(response.body.speaker));
            });
        });

        it(`should contain a non-null 'speaker.id' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.speaker.id));
            });
        });

        it(`should contain a non-null 'speaker.description' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(response.body.speaker.description));
            });
        });

        it(`should contain a non-null 'speaker.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(response.body.speaker.name));
            });
        });

        it(`should contain a non-null 'subcategory' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(response.body.subcategory));
            });
        });

        it(`should contain a non-null 'subcategory.id' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.subcategory.id));
            });
        });

        it(`should contain a non-null 'subcategory.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(response.body.subcategory.name));
            });
        });

        it(`should contain a non-null 'loop_count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.loop_count));
            });
        });

        it(`should contain a 'language' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(response.body.language));
            });
        });

        it(`should contain a 'language.id' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.language[k.Attr.Id]));
            });
        });

        it(`should contain a 'language.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.includes(['English', '日本語'], response.body.language[k.Attr.Name]));
            });
        });

        it(`should contain a 'language.code' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.includes(['en', 'ja'], response.body.language[k.Attr.Code]));
            });
        });

        it(`should contain a non-null 'related_videos' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(response.body.related_videos));
            });
        });

        it(`should contain a non-null 'related_videos.records' array`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                // console.log(response.body.related_videos);
                assert(_.isArray(response.body.related_videos.records));
            });
        });

        it(`should contain a non-null 'related_videos.count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.related_videos.count));
            });
        });

        it(`related_videos.records.length and related_videos.count should be equal`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert.equal(response.body.related_videos.records.length, response.body.related_videos.count);
            });
        });

        it(`should return at most 3 related videos`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.lte(response.body.related_videos.count, 3));
                assert(_.lte(response.body.related_videos.records.length, 3));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].id' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.related_videos.records)[k.Attr.Id]));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].length' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.related_videos.records)[k.Attr.Length]));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].loop_count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.related_videos.records)[k.Attr.LoopCount]));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].subcategory' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.related_videos.records).subcategory));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].subcategory.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.related_videos.records).subcategory[k.Attr.Name]));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].speaker' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.related_videos.records).speaker));
            });
        });

        it(`should contain a non-null 'related_videos.records[N].speaker.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.related_videos.records).speaker[k.Attr.Name]));
            });
        });

        it(`should return related videos whose 'created_at' property is a client-friendly datetime string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.related_videos.records).created_at));
            });
        });

        it(`should apply the timezone offset in the request to related videos 'created_at'`, function() {
            return request(server).get(`/videos/${videoId}?time_zone_offset=-540`).set(k.Header.Authorization, authorization).then(function(response) {
                const timeZoneOffset = _.first(response.body.related_videos.records).created_at.split(' ')[4];
                assert.equal('+0900', timeZoneOffset);
            });
        });

        it(`should contain a non-null 'related_videos.records[N].cued boolean if authorized`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isBoolean(_.first(response.body.related_videos.records).cued));
            });
        });

        it(`should not contain a 'related_videos.records[N].cued boolean if unauthorized`, function() {
            return request(server).get(`/videos/${videoId}`).then(function(response) {
                assert(!_.has(_.first(response.body.related_videos.records), 'cued'));
            });
        });

        it(`should return related videos whose category is the same as the video being shown`, async function() {
            let [expectedSubcategoryIds] = await db.sequelize.query(`
                SELECT id FROM subcategories WHERE category_id IN (
                    SELECT category_id FROM subcategories WHERE id = (
                        SELECT subcategory_id FROM videos WHERE id = ?
                    )
                )
            `, {replacements: [videoId]});

            expectedSubcategoryIds = _.map(expectedSubcategoryIds, 'id');

            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization);
            const actualSubcategoryIds = _.uniq(_.map(response.body.related_videos.records, 'subcategory.id'));

            assert.equal(_.difference(actualSubcategoryIds, expectedSubcategoryIds), 0);
        });

        it(`should contain a non-null 'like_count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.like_count));
            });
        });

        it(`should contain a non-null 'liked' boolean`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isBoolean(response.body.liked));
            });
        });

        it(`should contain a non-null 'length' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.length));
            });
        });

        it(`should contain a non-null 'transcripts' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(response.body.transcripts));
            });
        });

        it(`should contain a non-null 'transcripts.records' array`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isArray(response.body.transcripts.records));
            });
        });

        it(`should contain a non-null 'transcripts.count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.transcripts.count));
            });
        });

        it(`transcripts.records.length and transcripts.count should be equal`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert.equal(response.body.transcripts.records.length, response.body.transcripts.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].id' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.transcripts.records)[k.Attr.Id]));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].text' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.transcripts.records).text));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].language' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.transcripts.records).language));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].language.id' number`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.transcripts.records).language[k.Attr.Id]));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].language.code' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.transcripts.records).language[k.Attr.Code]));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].language.name' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.transcripts.records).language[k.Attr.Name]));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.transcripts.records).collocation_occurrences));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records' array`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isArray(_.first(response.body.transcripts.records).collocation_occurrences.records));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.transcripts.records).collocation_occurrences.count));
            });
        });

        it(`collocation_occurrences.records.length and collocation_occurrences.count should be equal`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert.equal(_.first(response.body.transcripts.records).collocation_occurrences.records.length,
                    _.first(response.body.transcripts.records).collocation_occurrences.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].id' number`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records)[k.Attr.Id]));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].text' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).text));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].ipa_spelling' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).ipa_spelling));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].usage_examples' object`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isPlainObject(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].usage_examples.records' array`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isArray(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples.records));
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].usage_examples.count' integer`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples.count));
            });
        });

        it(`usage_examples.records.length should be equal to usage_examples.count`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert.equal(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples.records.length,
                    _.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples.count);
            });
        });

        it(`should contain a non-null 'transcripts.records[N].collocation_occurrences.records[N].usage_examples.records[N].text' string`, function() {
            return request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(_.first(_.first(response.body.transcripts.records).collocation_occurrences.records).usage_examples.records).text));
            });
        });

        it('should localize the subcategory name based on the "lang" query param regardless of "Accept-Language" and user.interface_lang', async function() {
            const response = await request(server).get(`/videos/${videoId}`).query({lang: 'ja'}).set(k.Header.Authorization, authorization).set('Accept-Language', 'en-US,en;q=0.8,ja;q=0.6');
            assert(/[^a-z]/i.test(response.body.subcategory[k.Attr.Name]));
        });

        it('should localize the subcategory name based on "user.interface_language" if "lang" is absent and "Accept-Language" is different than user.interface_language', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization).set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[a-z]/i.test(response.body.subcategory[k.Attr.Name]));
        });

        it('should localize the subcategory name based on "Accept-Language" if "lang" is absent and user is unauthenticated', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[^a-z]/i.test(response.body.subcategory[k.Attr.Name]));
        });

        it('should localize the speaker name based on the lang query parameter if present', async function() {
            const response = await request(server).get(`/videos/${videoId}`).query({lang: 'ja'}).set(k.Header.Authorization, authorization);
            assert(/[^a-z]/i.test(response.body.speaker[k.Attr.Name]));
        });

        it('should localize the speaker name based on the user preferred interface language if the lang query parameter is missing', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization);
            assert(/[a-z]/i.test(response.body.speaker[k.Attr.Name]));
        });

        it('should localize the speaker description based on the lang query parameter if present', async function() {
            const response = await request(server).get(`/videos/${videoId}`).query({lang: 'ja'}).set(k.Header.Authorization, authorization);
            assert(/[^a-z]/i.test(response.body.speaker[k.Attr.Description]));
        });

        it('should localize the speaker description based on the user preferred interface language if the lang query parameter is missing', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization);
            assert(/[a-z]/i.test(response.body.speaker[k.Attr.Description]));
        });

        it('should localize the video description based on the lang query parameter if present', async function() {
            const response = await request(server).get(`/videos/${videoId}`).query({lang: 'ja'}).set(k.Header.Authorization, authorization);
            assert(/[^a-z]/i.test(response.body[k.Attr.Description]));
        });

        it('should localize the video description based on the user preferred interface language if the lang query parameter is missing', async function() {
            const response = await request(server).get(`/videos/${videoId}`).set(k.Header.Authorization, authorization);
            assert(/[a-z]/i.test(response.body[k.Attr.Description]));
        });
    });
});
