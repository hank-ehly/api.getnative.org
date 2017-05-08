/**
 * create-study-session.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/29.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const Promise = require('bluebird');
const request = require('supertest');
const assert  = require('assert');
const _       = require('lodash');

describe('POST /study', function() {
    let authorization = null;
    let account       = null;
    let reqBody       = null;
    let server        = null;
    let db            = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer());
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initGroup) {
            authorization = initGroup.authorization;
            account       = initGroup.response.body;
            server        = initGroup.server;
            db            = initGroup.db;

            const byAccountId = {
                where: {
                    account_id: account.id
                }
            };

            return db.StudySession.findAll(byAccountId).then(function(studySessions) {
                return db.WritingAnswer.destroy({
                    where: {
                        study_session_id: {
                            $in: _.map(studySessions, 'id')
                        }
                    }
                });
            }).then(function() {
                return Promise.join(db.CuedVideo.destroy(byAccountId), db.StudySession.destroy(byAccountId));
            }).then(function() {
                return db.Video.findOne();
            }).then(function(video) {
                reqBody = {
                    video_id: video.get(k.Attr.Id),
                    study_time: 300
                };
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
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('response.failure', function() {
        it(`should respond with 400 Bad Request if the 'video_id' request body parameter is missing`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({study_time: reqBody.study_time}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'video_id' request body parameter is not a number`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                study_time: reqBody.study_time,
                video_id: 'not_a_number'
            }).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'video_id' request body parameter is negative`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                study_time: reqBody.study_time,
                video_id: -6
            }).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'video_id' request body parameter is 0`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                study_time: reqBody.study_time,
                video_id: 0
            }).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'study_time' request body parameter is missing`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                video_id: reqBody.video_id
            }).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'study_time' request body parameter is not a number`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                study_time: 'not_a_number',
                video_id: reqBody.video_id
            }).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'study_time' request body parameter is negative`, function(done) {
            request(server).post('/study').set('authorization', authorization).send({
                study_time: -reqBody.study_time,
                video_id: reqBody.video_id
            }).expect(400, done);
        });
    });

    describe('response.success', function() {
        it(`should respond with 201 Created for a valid request`, function(done) {
            request(server).post('/study').set('authorization', authorization).send(reqBody).expect(201, done);
        });

        it(`should contain a non-zero 'id' integer`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(_.gt(response.body.id, 0));
            });
        });

        it(`should contain a non-zero 'video_id' integer`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(_.gt(response.body.video_id, 0));
            });
        });

        it(`should contain a non-zero 'study_time' integer`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(_.gt(response.body.study_time, 0));
            });
        });

        it(`should contain an 'is_completed' boolean whose value is false`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                assert.equal(response.body.is_completed, false);
            });
        });

        it(`should instantiate a new study_sessions record`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                db.StudySession.findOne({
                    where: {
                        account_id: account.id,
                        video_id: reqBody.video_id
                    }
                }).then(function(studySession) {
                    assert(studySession);
                });
            });
        });

        it(`should instantiate a new queued video record linking the current account and video being studied`, function() {
            return request(server).post('/study').set('authorization', authorization).send(reqBody).then(function(response) {
                db.CuedVideo.findOne({
                    where: {
                        account_id: account.id,
                        video_id: reqBody.video_id
                    }
                }).then(function(queuedVideo) {
                    assert(queuedVideo);
                });
            });
        });
    });
});
