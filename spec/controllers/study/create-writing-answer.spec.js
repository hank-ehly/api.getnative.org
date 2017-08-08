/**
 * create-writing-answer.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/05.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const crypto   = require('crypto');
const _        = require('lodash');

describe('POST /study/writing_answers', function() {
    let authorization = null;
    let server        = null;
    let req           = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(result) {
            authorization = result.authorization;
            server        = result.server;
            db            = result.db;

            return db[k.Model.Video].find().then(function(video) {
                return Promise.all([
                    db[k.Model.StudySession].create({
                        user_id: result.response.body[k.Attr.Id],
                        video_id: video.get(k.Attr.Id),
                        study_time: 300
                    }), db[k.Model.WritingQuestion].find({plain: true})
                ]);
            }).then(function(values) {
                const [studySession, writingQuestion] = values;
                const hash = crypto.randomBytes(8).toString('hex');
                req = {
                    answer: _.times(10, _.constant(`This answer has sixty words - ${hash}.`)).join(' '),
                    study_session_id: studySession.get(k.Attr.Id),
                    writing_question_id: writingQuestion.get(k.Attr.Id),
                    word_count: 60
                };
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/study/writing_answers').set('authorization', authorization).send(req).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/study/writing_answers').set('authorization', authorization).send(req).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 400 Bad Request if the study_session_id is 0`, function(done) {
            req.study_session_id = 0;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the study_session_id is negative`, function(done) {
            req.study_session_id = -1;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the study_session_id is not a number`, function(done) {
            req.study_session_id = _.stubString();
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the study_session_id does not exist`, function(done) {
            delete req.study_session_id;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the writing_question_id is 0`, function(done) {
            req.writing_question_id = 0;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the writing_question_id is negative`, function(done) {
            req.writing_question_id = -1;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the writing_question_id is not a number`, function(done) {
            req.writing_question_id = _.stubString();
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the writing_question_id does not exist`, function(done) {
            delete req.writing_question_id;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the answer is not a string`, function(done) {
            req[k.Attr.Answer] = _.random();
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the answer does not exist`, function(done) {
            delete req[k.Attr.Answer];
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the word_count is not a number`, function(done) {
            req[k.Attr.WordCount] = _.stubString();
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the word_count is negative`, function(done) {
            req[k.Attr.WordCount] = -1;
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the word_count does not exist`, function(done) {
            delete req[k.Attr.WordCount];
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(400, done);
        });
    });

    describe('success', function() {
        it(`should respond with 204 No Content for a valid request`, function(done) {
            request(server).post('/study/writing_answers').set('authorization', authorization).send(req).expect(204, done);
        });

        it(`should not contain a response body`, function() {
            return request(server).post('/study/writing_answers').set('authorization', authorization).send(req).then(function(response) {
                assert.equal(_.size(response.body), 0);
            });
        });

        it(`should register a WritingAnswer record with the correct answer linked to the correct StudySession`, function() {
            return request(server).post('/study/writing_answers').set('authorization', authorization).send(req).then(function() {
                return db.sequelize.query('SELECT * FROM writing_answers WHERE answer = ?', {replacements: [req.answer]});
            }).then(function(answer) {
                assert(_.gt(_.size(_.flattenDeep(answer)), 0));
            });
        });

        it(`should save the correct words per minute`, function() {
            return request(server).post('/study/writing_answers').set('authorization', authorization).send(req).then(function() {
                return db.sequelize.query('SELECT * FROM writing_answers WHERE answer = ?', {replacements: [req.answer]});
            }).then(function(answer) {
                let expected = _.round(req.word_count / 1.25);
                let actual = _.first(_.flattenDeep(answer))[k.Attr.WordsPerMinute];
                assert.equal(actual, expected);
            });
        });
    });
});
