/**
 * writing-answers.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/06.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('GET /study/:lang/writing_answers', function() {
    let server = null;
    let authorization = null;
    let user = null;
    let db = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(result) {
            authorization = result.authorization;
            server = result.server;
            user = result.response.body;
            db = result.db;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/study/en/writing_answers').expect(401, done);
        });

        it(`should return 400 Bad Request if the 'since' query parameter value is a future date`, function(done) {
            let twoDaysLater = new Date().getTime() + (1000 * 60 * 60 * 24 * 2);
            request(server).get(`/study/en/writing_answers?since=${twoDaysLater}`).set('authorization', authorization).expect(400, done);
        });

        it(`should return 400 Bad Request if the 'lang' parameter is not a valid language code`, function(done) {
            request(server).get(`/study/invalid/writing_answers`).set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 response if the 'max_id' query param value is 0`, function(done) {
            request(server).get('/study/en/writing_answers?max_id=0').set('authorization', authorization).expect(400, done);
        });

        it(`should return a 400 response if the 'max_id' query param value is a negative number`, function(done) {
            request(server).get('/study/en/writing_answers?max_id=-1000').set('authorization', authorization).expect(400, done);
        });

        // todo: invalid or unintelligible time_zone_offset
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });

        it('should receive a 200 OK response', function(done) {
            request(server).get('/study/en/writing_answers').set('authorization', authorization).expect(200, done);
        });

        it(`should respond with an object containing a top-level 'records' array value`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.records.length));
            });
        });

        it(`should respond with an object containing a top-level 'count' integer value`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it(`should have the same number of records as shown in 'count'`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(response.body.count === response.body.records.length);
            });
        });

        it(`should have an non-null 'id' number for each record`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        // The study_session_id value is not used in the client application,
        // but is necessary to confirm the relationship between User and WritingAnswer.
        it(`should have an non-null 'study_session_id' number for each record`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).study_session_id));
            });
        });

        it(`should have an non-null 'lang' language code for each record that is equal to the 'lang' request parameter value`, function() {
            const langCode = 'en';
            return request(server).get(`/study/${langCode}/writing_answers`).set('authorization', authorization).then(function(response) {
                assert.equal(_.first(response.body.records).lang, langCode);
            });
        });

        it(`should have a non-null 'answer' string for each record`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.first(response.body.records).answer.length > 0);
            });
        });

        it(`should have a non-null 'created_at' client-friendly datetime for each record`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isClientFriendlyDateString(_.first(response.body.records).created_at));
            });
        });

        it(`should apply the timezone offset in the request to 'created_at'`, function() {
            return request(server).get(`/study/en/writing_answers?time_zone_offset=-540`).set('authorization', authorization)
                .then(function(response) {
                    const timeZoneOffset = _.first(response.body.records).created_at.split(' ')[4];
                    assert.equal('+0900', timeZoneOffset);
                });
        });

        it(`should have a 'writing_question' object with a non-null 'text' string for each record`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(_.first(response.body.records)['writing_question'].text.length > 0);
            });
        });

        it(`should respond with records whose creation date is equal to or greater than the 'since' query parameter`, function() {
            let thirtyDaysAgo = new Date().getTime() - (1000 * 60 * 60 * 24 * 30);
            return request(server).get(`/study/en/writing_answers?since=${thirtyDaysAgo}`).set('authorization', authorization)
                .then(function(response) {
                    let lastRecord = response.body.records[response.body.count - 1];
                    let oldestRecordTimestamp = new Date(lastRecord.created_at).getTime();
                    assert(oldestRecordTimestamp >= thirtyDaysAgo);
                });
        });

        it('should only return 10 or less answers', function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(response.body.records.length <= 10, response.body.records.length);
            });
        });

        it(`should only return answers that belong to the authenticated user`, function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                const firstStudySessionId = _.first(response.body.records).study_session_id;
                return db.sequelize.query(`SELECT user_id FROM study_sessions WHERE id = ${firstStudySessionId}`).then(function(result) {
                    const responseUserId = _.first(_.flattenDeep(result)).user_id;
                    assert.equal(responseUserId, user.id);
                });
            });
        });

        it(`should return only records whose IDs are less than or equal to the 'max_id' query parameter`, async function() {
            const [answers] = await db.sequelize.query(`
                SELECT * 
                FROM writing_answers 
                WHERE study_session_id IN (
                    SELECT id 
                    FROM study_sessions 
                    WHERE user_id = ${user[k.Attr.Id]}
                );
            `);

            const midWritingAnswerId = answers[_.floor(answers.length / 2)][k.Attr.Id];

            const response = await request(server).get(`/study/en/writing_answers`)
                .query({max_id: midWritingAnswerId})
                .set('authorization', authorization);

            const lastId = response.body.records[response.body.count - 1][k.Attr.Id];
            assert(lastId <= midWritingAnswerId);
        });

        it(`should return only records whose language is equal to that of the 'lang' request param`, function() {
            const requestLang = 'ja';
            return request(server).get(`/study/${requestLang}/writing_answers`).set('authorization', authorization)
                .then(function(response) {
                    const studySessionIds = _.transform(response.body.records, function(ids, record) {
                        ids.push(record.study_session_id);
                    }, []);

                    return db.sequelize.query(`
                    SELECT L.code 
                    FROM videos V
                    LEFT JOIN languages L ON V.language_id = L.id
                    WHERE V.id IN (
                        SELECT video_id
                        FROM study_sessions 
                        WHERE id IN (${studySessionIds.join(',')})
                    )
                `).then(function(values) {
                        const [rows] = values;
                        _.forEach(rows, function(row) {
                            assert.equal(row[k.Attr.Code], requestLang);
                        });
                    });
                });
        });

        it('should localize the writing question text based on the language of the video to which the answer is linked', async function() {
            const response = await request(server).get(`/study/ja/writing_answers`).set('authorization', authorization);
            const text = _.first(response.body.records)['writing_question'].text;
            assert(/[^a-z]/i.test(text));
        });
    });
});
