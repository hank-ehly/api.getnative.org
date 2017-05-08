/**
 * index.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/17.
 */

const SpecUtil = require('../../spec-util');
const Utility  = require('../../../app/services').Utility;

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /videos', function() {
    let server = null;
    let authorization = null;
    let user = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server        = _.server;
            db            = _.db;
            authorization = _.authorization;
            user          = _.response.body;
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
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/videos').expect(401, done);
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
    });

    describe('response.success', function() {
        it('should receive a 200 OK response for a valid request', function(done) {
            request(server).get('/videos').set('authorization', authorization).expect(200, done);
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

        it(`should contain a non-null 'cued' boolean`, function() {
            return request(server).get(`/videos`).set('authorization', authorization).then(function(response) {
                assert(_.isBoolean(_.first(response.body.records).cued));
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
        it(`should contain a non-null number for 'subcategory.id' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                _.forEach(response.body.records, function(record) {
                    assert(_.isNumber(record.subcategory.id));
                });
            });
        });

        it(`should contain a positive number for 'loop_count' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                _.forEach(response.body.records, function(record) {
                    assert(_.isNumber(record.loop_count), 'loop_count is not a number');
                    // assert(_.gt(record.loop_count), 0, 'loop_count is not greater than or equal to 0');
                });
            });
        });

        it(`should contain a valid URI string for 'picture_url' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(_.first(response.body.records).picture_url));
            });
        });

        it(`should contain a valid URI string for 'video_url' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isValidURL(_.first(response.body.records).video_url));
            });
        });

        it(`should contain a positive number for 'length' on each record`, function() {
            return request(server).get('/videos').set('authorization', authorization).then(function(response) {
                _.forEach(response.body.records, function(record) {
                    assert(_.isNumber(record.length));
                    assert(_.gt(record.length, 0));
                });
            });
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
            return db.Video.findAll().then(function(videos) {
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
            return db.Category.findOne({attributes: ['id']}).then(function(category) {
                return request(server).get(`/videos?category_id=${category.get('id')}`).set('authorization', authorization).then(function(response) {
                    assert(_.isNumber(response.body.count));
                    assert(_.isArray(response.body.records));
                });
            });
        });

        it(`should return only English videos if the request contains no 'lang' parameter`, function() {
            return request(server).get(`/videos`).set('authorization', authorization).then(function(response) {
                let firstVideoId = _.first(response.body.records).id;
                return db.sequelize.query(`SELECT language_code FROM videos WHERE videos.id = ${firstVideoId} LIMIT 1`).spread(function(result) {
                    assert.equal(_.first(result).language_code, 'en');
                });
            });
        });

        it(`should return videos of a specific subcategory`, function() {
            return db.Subcategory.findOne({attributes: ['id']}).then(function(subcategory) {
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

            db.Category.findOne({attributes: ['id']}).then(function(category) {
                categoryId = category.get('id');
                return db.Subcategory.findAll({
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

        // todo e2e (check the category_id and subcategory_id don't conflict

        // q
        // full text search
        // transcript
        // collocations
        // category title
        // subcategory title
        // speaker name
    });
});
