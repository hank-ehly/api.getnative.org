/**
 * index.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/17.
 */

const SpecUtil = require('../../spec-util');
const Utility = require('../../../app/services')['Utility'];
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');
const youtube = require('../../../app/services/youtube');

describe('GET /videos', function() {
    let server, authorization, user, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);

        youtube.videosList = function(idx) {
            return Promise.resolve({
                items: _.times(idx.length, _.constant({
                    id: 'ri6Pip_w6HM',
                    contentDetails: {duration: 'PT1M3S'},
                    statistics: {viewCount: '13438'}
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
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Request if "include_private" is not a boolean', function(done) {
            request(server).get('/videos?include_private=notABoolean').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the request contains an unidentifiable 'lang' code parameter`, function(done) {
            request(server).get('/videos?lang=notALangCode').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the request contains a value for 'cued_only' that is not 'true' or 'false'`, function(done) {
            request(server).get('/videos?cued_only=notABoolean').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the request contains a non-numeric 'count' parameter`, function(done) {
            request(server).get('/videos?count=notANumber').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request Entity response if the request contains a non-numeric 'max_id' parameter`, function(done) {
            request(server).get('/videos?max_id=notANumber').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the request contains a non-numeric 'subcategory_id' parameter`, function(done) {
            request(server).get('/videos?subcategory_id=notANumber').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the request contains a non-numeric 'category_id' parameter`, function(done) {
            request(server).get('/videos?category_id=notANumber').set('authorization', authorization).expect(400, done);
        });

        // todo: limit is too low
        it(`should return a 400 Bad Request response if the 'count' is above 9`, function(done) {
            request(server).get(`/videos?count=11`).set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 Bad Request response if the 'count' is 0`, function(done) {
            request(server).get(`/videos?count=0`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with a 400 Bad Request if the 'q' parameter is longer than 100 characters`, function(done) {
            let q = '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';
            request(server).get(`/videos?q=${q}`).set('authorization', authorization).expect(400, done);
        });

        it(`should return an error object with a top-level 'errors' array`, function() {
            request(server).get('/videos?subcategory_id=notANumber').set('authorization', authorization).then(function(response) {
                assert(_.isArray(response.errors));
            });
        });

        it(`should return a 'message' string inside the error object`, function() {
            request(server).get('/videos?subcategory_id=notANumber').set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.errors).message));
            });
        });

        it(`should return a 'code' number inside the error object`, function() {
            request(server).get('/videos?subcategory_id=notANumber').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.errors).code));
            });
        });

        // todo: can't include the same parameter more than once
        // todo: bad time_zone_offset
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header if authorized', async function() {
            const response = await request(server).get('/videos').set('authorization', authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should not respond with an X-GN-Auth-Token header if not authorized', function() {
            return request(server).get('/videos').then(function(response) {
                assert(!response.header[k.Header.AuthToken]);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should receive a 200 OK response for a valid request if authorized', function(done) {
            request(server).get('/videos').set('authorization', authorization).expect(200, done);
        });

        it('should receive a 200 OK response for a valid request even if not authorized', function(done) {
            request(server).get('/videos').expect(200, done);
        });

        it('should return only public videos by default', async function() {
            // update latest video to make it private & cache ID
            const videos = await db[k.Model.Video].findAll({
                order: [[k.Attr.Id, 'DESC']],
                limit: 1
            });

            const cachedId = _.first(videos).get(k.Attr.Id);

            await db[k.Model.Video].update({
                is_public: false
            }, {
                where: {id: cachedId}
            });

            const response = await request(server).get('/videos').set('authorization', authorization);
            const videoIds = _.map(response.body.records, k.Attr.Id);

            // expect cached ID not to be in response
            assert(!_.includes(videoIds, cachedId));
        });

        it('should ignore the "include_private" flag if the user does not have admin privileges', async function() {
            let videoIds, cachedId;

            try {
                const videos = await db[k.Model.Video].findAll({
                    order: [[k.Attr.Id, 'DESC']],
                    limit: 1
                });

                cachedId = _.first(videos).get(k.Attr.Id);

                await db[k.Model.Video].update({
                    is_public: false
                }, {
                    where: {id: cachedId}
                });

                const response = await request(server).get('/videos').query({include_private: true}).set('authorization', authorization);
                videoIds = _.map(response.body.records, k.Attr.Id);
            } catch (e) {
                assert.fail(e, null, 'Error occurred during assertion setup');
            }

            assert(!_.includes(videoIds, cachedId));
        });

        it('should return private videos if "include_private" is true and the user has admin privileges', function(done) {
            this.timeout(SpecUtil.defaultTimeout);
            // close non-admin server connection
            server.close(async function() {
                const adminLoginRes = await SpecUtil.login(true);
                authorization = adminLoginRes.authorization;
                server = adminLoginRes.server;
                db = adminLoginRes.db;

                // setup private video
                const videos = await db[k.Model.Video].findAll({
                    order: [[k.Attr.Id, 'DESC']],
                    limit: 1,
                    where: {
                        language_id: await db[k.Model.Language].findIdForCode('en')
                    }
                });

                const cachedId = _.first(videos).get(k.Attr.Id);

                try {
                    await db[k.Model.Video].update({is_public: false}, {where: {id: cachedId}});
                } catch (e) {
                    done(e);
                }

                // make request with flag
                const response = await request(server).get('/videos').query({include_private: true}).set('authorization', authorization);
                const videoIds = _.map(response.body.records, k.Attr.Id);

                // expect cachedId to be in response
                assert(_.includes(videoIds, cachedId));
                done();
            });
        });

        it(`should return a 200 OK response regardless of whether the 'lang' parameter value is upper or lower case`, function(done) {
            request(server).get('/videos?lang=eN').set('authorization', authorization).expect(200, done);
        });

        it(`should respond with an object containing a top-level 'records' array value`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isArray(response.body.records));
            });
        });

        it(`should respond with an object containing a top-level 'count' integer value`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it(`should have the same number of records as shown in 'count'`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(response.body.count === response.body.records.length);
            });
        });

        it(`should have an non-null 'id' number for each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        it(`should contain a non-null 'cued' boolean if authenticated`, function() {
            return request(server).get(`/videos`).set('authorization', authorization).then(function(response) {
                assert(_.isBoolean(_.first(response.body.records).cued));
            });
        });

        it(`should not contain a 'cued' boolean if unauthenticated`, function() {
            return request(server).get(`/videos`).then(function(response) {
                assert(!_.has(_.first(response.body.records), 'cued'));
            });
        });

        it(`should only return cued videos if the 'cued_only' parameter is set to 'true'`, function() {
            return request(server).get(`/videos?cued_only=true`).set('authorization', authorization).then(function(response) {
                _.forEach(response.body.records, function(record) {
                    assert.equal(record.cued, true);
                });
            });
        });

        it(`should contain a non-null date string for 'created_at' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(_.first(response.body.records).created_at));
            });
        });

        it(`should return the 'created_at' date in the format 'Thu Dec 14 04:35:55 +0000 2017'`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.records).created_at));
            });
        });

        it(`should apply the timezone offset in the request to 'created_at'`, function() {
            return request(server).get('/videos?time_zone_offset=-540').set('authorization', authorization).then(function(response) {
                const timeZoneOffset = _.first(response.body.records).created_at.split(' ')[4];
                assert.equal('+0900', timeZoneOffset);
            });
        });

        it(`should contain a non-null object for 'speaker' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.records).speaker));
            });
        });

        it(`should contain a non-null string for 'speaker.name' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).speaker.name));
                assert.notEqual(_.first(response.body.records).speaker.name, '');
            });
        });

        it(`should contain a non-null object for 'subcategory' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isPlainObject(_.first(response.body.records).subcategory));
            });
        });

        it(`should contain a non-null string for 'subcategory.name' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).subcategory.name));
                assert.notEqual(_.first(response.body.records).subcategory.name, '');
            });
        });

        // subcategory.id is not needed for display; rather for data validation
        it(`should contain a non-null number for 'subcategory.id' on each record`, async function() {
            const response = await request(server).get('/videos').set('authorization', authorization);
            assert(_.every(response.body.records, record => _.isNumber(record.subcategory.id)));
        });

        it(`should contain a positive number for 'loop_count' on each record`, async function() {
            const response = await request(server).get('/videos').set('authorization', authorization);
            assert(_.every(response.body.records, record => _.isNumber(record.loop_count)));
        });

        it(`should contain a 'youtube_video_id' string on each record`, async function() {
            const response = await request(server).get('/videos').set('authorization', authorization);
            assert(_.every(response.body.records, k.Attr.YouTubeVideoId));
        });

        it(`should contain a positive number for 'length' on each record`, async function() {
            const response = await request(server).get('/videos').set('authorization', authorization);
            assert(_.every(response.body.records, record => _.isNumber(record.length) && _.gt(record.length, 0)));
        });

        it('should respond with an empty records array if no matching records are found', function() {
            let requestURLString = `/videos?max_id=1`;
            return request(server).get(requestURLString).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.records.length, 0);
            });
        });

        it('should respond with a 0 count if no matching records are found', function() {
            let requestURLString = `/videos?max_id=1`;
            return request(server).get(requestURLString).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.count, 0);
            });
        });

        it(`should return only records whose IDs are less than the 'max_id' query parameter`, function() {
            return db[k.Model.Video].findAll().then(function(videos) {
                let midVideoId = videos[Math.floor(videos.length / 2)].get('id');
                return request(server).get(`/videos?max_id=${midVideoId}`).set('authorization', authorization).then(function(response) {
                    assert(_.lt(_.first(response.body.records).id, midVideoId));
                });
            });
        });

        it(`should return no more than 9 video records`, function() {
            return request(server).get(`/videos`).set('authorization', authorization).then(function(response) {
                assert(_.lte(response.body.count, 9));
            });
        });

        it(`should return 1 video if count is 1`, function() {
            return request(server).get(`/videos?count=1`).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.count, 1);
            });
        });

        it(`should return videos if a category_id is specified`, function() {
            return db[k.Model.Category].find({attributes: ['id']}).then(function(category) {
                return request(server).get(`/videos?category_id=${category.get('id')}`).set('authorization', authorization).then(function(response) {
                    assert(_.isNumber(response.body.count));
                    assert(_.isArray(response.body.records));
                });
            });
        });

        it(`should return only English videos if the request contains no 'lang' parameter`, function() {
            return request(server).get(`/videos`).set('authorization', authorization).then(function(response) {
                let firstVideoId = _.first(response.body.records)[k.Attr.Id];
                return db.sequelize.query(`SELECT language_id FROM videos WHERE videos.id = ${firstVideoId} LIMIT 1`).then(function(values) {
                    const [rows] = values;
                    return db[k.Model.Language].find({where: {code: 'en'}, attributes: [k.Attr.Id]}).then(function(language) {
                        assert.equal(_.first(rows).language_id, language.get(k.Attr.Id));
                    });
                });
            });
        });

        it(`should return videos of a specific subcategory`, function() {
            return db[k.Model.Subcategory].find({attributes: ['id']}).then(function(subcategory) {
                const id = subcategory.get('id');
                return request(server).get(`/videos?subcategory_id=${id}`).set('authorization', authorization).then(function(response) {
                    _.forEach(response.body.records, function(record) {
                        assert.equal(record.subcategory.id, id);
                    });
                });
            });
        });

        it(`should return videos of a specific category`, function() {
            let categoryId = null;

            db[k.Model.Category].find({attributes: ['id']}).then(function(category) {
                categoryId = category.get('id');
                return db[k.Model.Subcategory].findAll({
                    attributes: ['id'],
                    where: {category_id: categoryId}
                });
            }).then(function(subcategories) {
                const ids = _.transform(subcategories, function(result, n) {
                    result.push(n.get('id'));
                }, []);

                return request(server).get(`/videos?category_id=${categoryId}`).set('authorization', authorization).then(function(response) {
                    _.forEach(response.body.records, function(record) {
                        assert(_.includes(ids, record.subcategory.id));
                    });
                });
            });
        });

        it('should localize the subcategory name based on the interface_lang query parameter', async function() {
            const response = await request(server).get(`/videos`).query({interface_lang: 'ja'}).set('Accept-Language', 'en-US,en;q=0.8,ja;q=0.6');
            assert(/[^a-z]/i.test(_.first(response.body.records).subcategory[k.Attr.Name]));
        });

        it('should localize the subcategory name based on the user.interface_language if authenticated and "interface_lang" is absent, even if "Accept-Language" is different than user.interface_language', async function() {
            const response = await request(server).get(`/videos`).set('authorization', authorization).set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[a-z]/i.test(_.first(response.body.records).subcategory[k.Attr.Name]));
        });

        it('should localize the subcategory name based on the "Accept-Language" header if the unauthenticated and "interface_lang" is absent', async function() {
            const response = await request(server).get(`/videos`).set('Accept-Language', 'ja-JP,ja;q=0.8,en;q=0.6');
            assert(/[^a-z]/i.test(_.first(response.body.records).subcategory[k.Attr.Name]));
        });

        it('should localize the speaker name based on the interface_lang query parameter if present', async function() {
            const response = await request(server).get(`/videos`).query({interface_lang: 'ja'}).set('authorization', authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records).speaker[k.Attr.Name]));
        });

        it('should localize the speaker name based on the user preferred interface language if the interface_lang query parameter is missing', async function() {
            const response = await request(server).get(`/videos`).set('authorization', authorization);
            assert(/[a-z]/i.test(_.first(response.body.records).speaker[k.Attr.Name]));
        });

        // q
        // full text search
        // transcript
        // collocation occurrences
        // category title
        // subcategory title
        // speaker name
    });
});
