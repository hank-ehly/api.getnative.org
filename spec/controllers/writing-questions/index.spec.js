/**
 * index.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/03.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('GET /videos/:id/writing_questions', function() {
    let authorization, server, db, englishVideoId;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login();
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        const englishLanguageId = await db[k.Model.Language].findIdForCode('en');
        englishVideoId = (await db[k.Model.Video].find({where: {language_id: englishLanguageId}, attributes: [k.Attr.Id]})).get(k.Attr.Id);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 400 Bad Request if the :id param is not a number`, function() {
            return request(server).get(`/videos/not_a_number/writing_questions`).set(k.Header.Authorization, authorization).expect(400);
        });

        it(`should respond with 400 Bad Request if the :id param is 0`, function() {
            return request(server).get(`/videos/0/writing_questions`).set(k.Header.Authorization, authorization).expect(400);
        });

        it(`should respond with 400 Bad Request if the 'count' value is not a number`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions?count=not_a_number`).set(k.Header.Authorization, authorization).expect(400);
        });

        it(`should respond with 400 Bad Request if the 'count' value is 0`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions?count=0`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should respond with 404 Not Found if no WritingQuestion records can be found for the video id', function() {
            return request(server).get(`/videos/99999999/writing_questions`).set(k.Header.Authorization, authorization).expect(404);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it(`should respond with 200 OK for a successful request`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).expect(200);
        });

        it(`should return an object with a top-level 'records' array`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isArray(response.body.records));
            });
        });

        it(`should return an object with a top-level 'count' integer`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it(`should have an equal number of records as described in 'count'`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert.equal(response.body.count, response.body.records.length);
            });
        });

        it(`should return an object with a records[N].id integer`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        it(`should return an object with a records[N].example_answer string`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).example_answer));
            });
        });

        it(`should return an object with a records[N].text string`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).text));
            });
        });

        it(`should return all the writing_questions records for the specified video subcategory`, async function() {
            const response = await request(server).get(`/videos/${englishVideoId}/writing_questions`).set(k.Header.Authorization, authorization);
            let video = await db[k.Model.Video].findByPrimary(englishVideoId, {
                include: {
                    model: db[k.Model.Subcategory],
                    as: 'subcategory',
                    attributes: [k.Attr.Id]
                }
            });
            video = video.get({plain: true});
            const subcategoryId = video.subcategory[k.Attr.Id];
            const q = `SELECT COUNT(id) AS count FROM writing_questions WHERE subcategory_id = ?`;
            const actual = response.body.count;

            const [results] = await db.sequelize.query(q, {replacements: [subcategoryId]});
            const expected = _.first(results).count;

            assert.equal(actual, expected);
        });

        it(`should return as many or fewer writing answer records as specified by the 'count' query parameter`, function() {
            return request(server).get(`/videos/${englishVideoId}/writing_questions?count=2`).set(k.Header.Authorization, authorization).then(function(response) {
                assert(_.lte(response.body.count, 2));
            });
        });

        it('should localize the records[N].example_answer based on the language of the video being studied', async function() {
            const japaneseLanguageId = await db[k.Model.Language].findIdForCode('ja');
            const japaneseVideoId = (await db[k.Model.Video].find({where: {language_id: japaneseLanguageId}, attributes: [k.Attr.Id]})).get(k.Attr.Id);
            const response = await request(server).get(`/videos/${japaneseVideoId}/writing_questions`).set(k.Header.Authorization, authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.ExampleAnswer]));
        });

        it('should localize the records[N].text based on the language of the video being studied', async function() {
            const japaneseLanguageId = await db[k.Model.Language].findIdForCode('ja');
            const japaneseVideoId = (await db[k.Model.Video].find({where: {language_id: japaneseLanguageId}, attributes: [k.Attr.Id]})).get(k.Attr.Id);
            const response = await request(server).get(`/videos/${japaneseVideoId}/writing_questions`).set(k.Header.Authorization, authorization);
            assert(/[^a-z]/i.test(_.first(response.body.records)[k.Attr.Text]));
        });
    });
});
