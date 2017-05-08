/**
 * writing-answers.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/06.
 */

const SpecUtil = require('../../spec-util');

const Promise  = require('bluebird');
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('GET /study/writing_answers', function() {
    let server        = null;
    let authorization = null;
    let user          = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(_) {
            server = _.server;
            db = _.db;
            authorization = _.authorization;
            user = _.response.body;
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
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(response.header['x-gn-auth-token'].length > 0);
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get('/study/en/writing_answers').set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header['x-gn-auth-expire']));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function(done) {
            request(server).get('/study/en/writing_answers').expect(401, done);
        });

        it(`should return a 400 response if the 'since' query parameter value is a future date`, function(done) {
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
    });

    describe('response.success', function() {
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
        // but is necessary to confirm the relationship between Account and WritingAnswer.
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
            return request(server).get(`/study/en/writing_answers?time_zone_offset=-540`).set('authorization', authorization).then(function(response) {
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
            return request(server).get(`/study/en/writing_answers?since=${thirtyDaysAgo}`).set('authorization', authorization).then(function(response) {
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
                return db.sequelize.query(`SELECT account_id FROM study_sessions WHERE id = ${firstStudySessionId}`).then(function(result) {
                    const responseAccountId = _.first(_.flattenDeep(result)).account_id;
                    assert.equal(responseAccountId, user.id);
                });
            });
        });

        it(`should return only records whose IDs are less than or equal to the 'max_id' query parameter`, function() {
            let allUserWritingAnswers = `
                SELECT * 
                FROM writing_answers 
                WHERE study_session_id IN (
                    SELECT id 
                    FROM study_sessions 
                    WHERE account_id = ${user.id}
                );
            `;

            return db.sequelize.query(allUserWritingAnswers).then(function(answers) {
                let midWritingAnswerId = _.first(answers)[Math.floor(_.first(answers).length / 2)].id;
                return request(server).get(`/study/en/writing_answers?max_id=${midWritingAnswerId}`).set('authorization', authorization).then(function(response) {
                    let lastId = response.body.records[response.body.count - 1].id;
                    assert(lastId >= midWritingAnswerId);
                });
            });
        });

        it(`should return only records whose language is equal to that of the 'lang' request param`, function() {
            const requestLang = 'ja';
            return request(server).get(`/study/${requestLang}/writing_answers`).set('authorization', authorization).then(function(response) {
                const studySessionIds = _.transform(response.body.records, (ids, record) => {
                    ids.push(record.study_session_id);
                }, []);

                return db.sequelize.query(`
                    SELECT \`language_code\` 
                    FROM \`videos\` 
                    WHERE \`id\` IN (
                        SELECT \`video_id\` 
                        FROM \`study_sessions\` 
                        WHERE \`id\` IN (${studySessionIds.join(',')})
                    )
                `).spread(rows => {
                    _.forEach(rows, (row) => {
                        assert.equal(row.language_code, requestLang);
                    });
                });
            });
        });
    });
});
