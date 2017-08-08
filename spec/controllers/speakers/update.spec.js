/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/13.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services/auth');
const config = require('../../../config/application').config;

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');
const chance = require('chance').Chance();

describe('PATCH /speakers/:id', function() {
    let authorization, server, db, speaker, updates, languages, genders;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        server = results.server;
        authorization = results.authorization;
        db = results.db;
        if (!languages) {
            languages = await db[k.Model.Language].findAll();
        }
        if (!genders) {
            genders = await db[k.Model.Gender].findAll();
        }
        speaker = await db[k.Model.Speaker].find({
            include: {
                model: db[k.Model.SpeakerLocalized],
                as: 'speakers_localized'
            }
        });
        updates = buildUniqueRequestBody();
    });

    function buildUniqueRequestBody() {
        const localizations = [];

        for (let localization of speaker.speakers_localized) {
            localizations.push({
                id: localization.get(k.Attr.Id),
                description: chance.paragraph({sentences: 2}),
                location: chance.city(),
                name: chance.name()
            });
        }

        return {
            gender_id: _.sample(genders).get(k.Attr.Id),
            localizations: localizations
        }
    }

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it(`should respond with 401 Unauthorized if the request does not contain an 'authorization' header`, function() {
            return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).expect(401);
        });

        describe('id', function() {
            it('should respond with 400 Bad Request if the "id" parameter is not a number', function() {
                return request(server).patch('/speakers/not_a_number').set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should respond with 400 Bad Request if the "id" parameter is 0', function() {
                return request(server).patch('/speakers/0').set(k.Header.Authorization, authorization).send(updates).expect(400);
            });
        });

        describe('gender_id', function() {
            it('should respond with 400 Bad Request if "gender_id" is not a number', function() {
                const testBody = _.set(_.cloneDeep(updates), 'gender_id', _.stubObject());
                return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "gender_id" is 0', function() {
                const testBody = _.set(_.cloneDeep(updates), 'gender_id', 0);
                return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 404 Bad Request if "gender_id" does not correspond to an existing Gender record', function() {
                const testBody = _.set(_.cloneDeep(updates), 'gender_id', Math.pow(10, 4));
                return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(404);
            });
        });

        describe('localizations', function() {
            it('should respond with 400 Bad Request if "localizations" is not an array', function() {
                const testBody = _.set(_.cloneDeep(updates), 'localizations', 'not_an_array');
                return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "localizations" contains more objects than there are existing language', function() {
                const testBody = _.cloneDeep(updates);
                testBody.localizations.push(_.first(testBody.localizations));
                return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            describe('localizations[N].id', function() {
                it('should respond with 400 Bad Request if "localizations[N].id" is not a number', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].id', _.stubArray());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].id" is 0', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].id', 0);
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if a localization is provided without an "id"', function() {
                    const testBody = _.omit(updates, 'localizations[0].id');
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });

            describe('localizations[N].description', function() {
                it('should respond with 400 Bad Request if "localizations[N].description" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].description', _.stubArray());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].description" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].description', _.stubString());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].description" is longer than 1000 chars', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].description', _.times(1001, _.constant('x')).join(''));
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });

            describe('localizations[N].location', function() {
                it('should respond with 400 Bad Request if "localizations[N].location" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].location', _.stubArray());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].location" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].location', _.stubString());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].location" is longer than 100 chars', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].location', _.times(101, _.constant('x')).join(''));
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });

            describe('localizations[N].name', function() {
                it('should respond with 400 Bad Request if "localizations[N].name" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].name', _.stubArray());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].name" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].name', _.stubString());
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].name" is longer than 100 chars', function() {
                    const testBody = _.set(_.cloneDeep(updates), 'localizations[0].name', _.times(101, _.constant('x')).join(''));
                    return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 204 No Content for a valid request', function() {
            return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(204);
        });

        it('should respond with 304 if the request body is empty', function() {
            return request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({}).expect(304);
        });

        it('should update the Speaker record', async function() {
            await request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
            await speaker.reload();
            assert.equal(speaker.get(k.Attr.GenderId), updates.gender_id);
        });

        it('should update the SpeakerLocalized records associated with the Speaker', async function() {
            await request(server).patch(`/speakers/${speaker.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
            await speaker.reload({
                include: {
                    model: db[k.Model.SpeakerLocalized],
                    as: 'speakers_localized'
                }
            });

            const id = _.first(updates.localizations)[k.Attr.Id];
            const actualName = _.find(speaker.get('speakers_localized'), {id: id}).get(k.Attr.Name);
            const expectedName = _.find(updates.localizations, {id: id})[k.Attr.Name];

            assert.equal(actualName, expectedName);
        });
    });
});
