/**
 * complete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/01.
 */

const SpecUtil = require('../../spec-util');
const k        = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request  = require('supertest');
const assert   = require('assert');
const _        = require('lodash');

describe('POST /study/complete', function() {
    let authorization = null;
    let reqBody       = null;
    let server        = null;
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
                return db[k.Model.StudySession].create({
                    video_id: video.get(k.Attr.Id),
                    user_id: result.response.body.id,
                    study_time: 300,
                    is_completed: false
                });
            }).then(function(studySession) {
                reqBody = {
                    id: studySession.get(k.Attr.Id)
                }
            });
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).post('/study/complete').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).post('/study/complete').set('authorization', authorization).send(reqBody).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 400 Bad Request if the 'id' request body parameter is missing`, function(done) {
            request(server).post('/study/complete').set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'id' request body parameter is not a number`, function(done) {
            request(server).post('/study/complete').set('authorization', authorization).send({id: 'not_a_number'}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'id' request body parameter is negative`, function(done) {
            request(server).post('/study/complete').set('authorization', authorization).send({id: -6}).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'id' request body parameter is 0`, function(done) {
            request(server).post('/study/complete').set('authorization', authorization).send({id: 0}).expect(400, done);
        });
    });

    describe('success', function() {
        it(`should respond with 204 No Content for a valid request`, function(done) {
            request(server).post('/study/complete').set('authorization', authorization).send(reqBody).expect(204, done);
        });

        it(`should mark the study session record as complete`, function() {
            return request(server).post('/study/complete').set('authorization', authorization).send(reqBody).then(function() {
                return db.StudySession.findByPrimary(reqBody.id, {attributes: [k.Attr.IsCompleted]});
            }).then(function(studySession) {
                assert(studySession.is_completed);
            });
        });
    });
});
