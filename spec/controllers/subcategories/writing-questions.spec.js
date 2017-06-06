/**
 * writing-questions.spec
 * get-native.com
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

// todo: Move to writing questions controller
describe('GET /subcategories/:id/writing_questions', function() {
    let authorization = null;
    let server = null;
    let db = null;
    let id = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login();
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        const subcategory = await db[k.Model.Subcategory].find({attributes: [k.Attr.Id]});
        id = subcategory.get(k.Attr.Id);
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('response.headers', function() {
        it('should respond with an X-GN-Auth-Token header', function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });
        });
    });

    describe('failure', function() {
        it(`should respond with 400 Bad Request if the :id param is not a number`, function(done) {
            request(server).get(`/subcategories/not_a_number/writing_questions`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the :id param is 0`, function(done) {
            request(server).get(`/subcategories/0/writing_questions`).set('authorization', authorization).expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'count' value is not a number`, function(done) {
            request(server).get(`/subcategories/${id}/writing_questions?count=not_a_number`).set('authorization', authorization)
                .expect(400, done);
        });

        it(`should respond with 400 Bad Request if the 'count' value is 0`, function(done) {
            request(server).get(`/subcategories/${id}/writing_questions?count=0`).set('authorization', authorization).expect(400, done);
        });

        it('should respond with 404 Not Found if no WritingQuestion records can be found for the subcategory id', function(done) {
            request(server).get(`/subcategories/99999999/writing_questions`).set('authorization', authorization).expect(404, done);
        });
    });

    describe('success', function() {
        it(`should respond with 200 OK for a successful request`, function(done) {
            request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).expect(200, done);
        });

        it(`should return an object with a top-level 'records' array`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.isArray(response.body.records));
            });
        });

        it(`should return an object with a top-level 'count' integer`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(response.body.count));
            });
        });

        it(`should have an equal number of records as described in 'count'`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert.equal(response.body.count, response.body.records.length);
            });
        });

        it(`should return an object with a records[N].id integer`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.isNumber(_.first(response.body.records).id));
            });
        });

        it(`should return an object with a records[N].example_answer string`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).example_answer));
            });
        });

        it(`should return an object with a records[N].text string`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                assert(_.isString(_.first(response.body.records).text));
            });
        });

        it(`should return all the writing_questions records for the specified subcategory`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization).then(function(response) {
                const q = `SELECT COUNT(id) AS count FROM writing_questions WHERE subcategory_id = ?`;
                const actual = response.body.count;
                return db.sequelize.query(q, {replacements: [id]}).spread(function(results) {
                    const expected = _.first(results).count;
                    assert.equal(actual, expected);
                });
            });
        });

        it(`should return as many or fewer writing answer records as specified by the 'count' query parameter`, function() {
            return request(server).get(`/subcategories/${id}/writing_questions?count=2`).set('authorization', authorization).then(function(response) {
                assert(_.lte(response.body.count, 2));
            });
        });

        it('should localize the records[N].example_answer based on the lang query param if present', async function() {
            const response = await request(server).get(`/subcategories/${id}/writing_questions`).query({lang: 'ja'}).set('authorization', authorization);
            assert(_.startsWith(_.first(response.body.records)[k.Attr.ExampleAnswer], 'ja'));
        });

        it('should localize the records[N].example_answer based on the user interface language if the lang query param is not present', async function() {
            const response = await request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization);
            assert(_.startsWith(_.first(response.body.records)[k.Attr.ExampleAnswer], 'en'));
        });

        it('should localize the records[N].text based on the lang query param if present', async function() {
            const response = await request(server).get(`/subcategories/${id}/writing_questions`).query({lang: 'ja'}).set('authorization', authorization);
            assert(_.startsWith(_.first(response.body.records)[k.Attr.Text], 'ja'));
        });

        it('should localize the records[N].text based on the user interface language if the lang query param is not present', async function() {
            const response = await request(server).get(`/subcategories/${id}/writing_questions`).set('authorization', authorization);
            assert(_.startsWith(_.first(response.body.records)[k.Attr.Text], 'en'));
        });
    });
});
