/**
 * create.spec
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

describe('POST /speakers', function() {
    let authorization, server, db, newSpeaker, languages, genders;

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
        newSpeaker = buildUniqueRequest();
    });

    function buildUniqueRequest() {
        const localizations = [];

        for (let language of languages) {
            localizations.push({
                language_id: language.get(k.Attr.Id),
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
        describe('gender_id', function() {
            it('should respond with 400 Bad Request if "gender_id" is missing', function() {
                const testBody = _.omit(newSpeaker, 'gender_id');
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "gender_id" is not a number', function() {
                const testBody = _.set(_.cloneDeep(newSpeaker), 'gender_id', _.stubObject());
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "gender_id" is 0', function() {
                const testBody = _.set(_.cloneDeep(newSpeaker), 'gender_id', 0);
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 404 Bad Request if "gender_id" does not correspond to an existing Gender record', function() {
                const testBody = _.set(_.cloneDeep(newSpeaker), 'gender_id', Math.pow(10, 4));
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(404);
            });
        });

        describe('localizations', function() {
            it('should respond with 400 Bad Request if "localizations" is missing', function() {
                const testBody = _.omit(newSpeaker, 'localizations');
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "localizations" is not an array', function() {
                const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations', 'not_an_array');
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "localizations" has a length of 0', function() {
                const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations', _.stubArray());
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should respond with 400 Bad Request if "localizations" contains less objects than there are existing language', function() {
                const testBody = _.omit(newSpeaker, 'localizations[0]');
                return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
            });

            describe('localizations[N].language_id', function() {
                it('should respond with 400 Bad Request if "localizations[N].language_id" is missing', function() {
                    const testBody = _.omit(newSpeaker, 'localizations[0].language_id');
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].language_id" is not a number', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].language_id', _.stubArray());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].language_id" is 0', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].language_id', 0);
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 404 Bad Request if "localizations[N].language_id" does not correspond to an existing Language record', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].language_id', Math.pow(10, 5));
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(404);
                });
            });

            describe('localizations[N].description', function() {
                it('should respond with 400 Bad Request if "localizations[N].description" is missing', function() {
                    const testBody = _.omit(newSpeaker, 'localizations[0].description');
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].description" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].description', _.stubArray());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].description" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].description', _.stubString());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].description" is longer than 1000 chars', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].description', _.times(1001, _.constant('x')).join(''));
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });

            describe('localizations[N].location', function() {
                it('should respond with 400 Bad Request if "localizations[N].location" is missing', function() {
                    const testBody = _.omit(newSpeaker, 'localizations[0].location');
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].location" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].location', _.stubArray());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].location" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].location', _.stubString());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].location" is longer than 100 chars', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].location', _.times(101, _.constant('x')).join(''));
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });

            describe('localizations[N].name', function() {
                it('should respond with 400 Bad Request if "localizations[N].name" is missing', function() {
                    const testBody = _.omit(newSpeaker, 'localizations[0].name');
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].name" is not a string', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].name', _.stubArray());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].name" has a length of 0', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].name', _.stubString());
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });

                it('should respond with 400 Bad Request if "localizations[N].name" is longer than 100 chars', function() {
                    const testBody = _.set(_.cloneDeep(newSpeaker), 'localizations[0].name', _.times(101, _.constant('x')).join(''));
                    return request(server).post('/speakers').send(testBody).set(k.Header.Authorization, authorization).expect(400);
                });
            });
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should respond with 201 Created for a valid request', function() {
            return request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization).expect(201);
        });

        it('should create a new Speaker record', async function() {
            const beforeCount = await db[k.Model.Speaker].count();
            await request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.Speaker].count();
            assert.equal(afterCount, beforeCount + 1);
        });

        it('should create a new SpeakerLocalized record for each language', async function() {
            const beforeCount = await db[k.Model.SpeakerLocalized].count();
            await request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization);
            const afterCount = await db[k.Model.SpeakerLocalized].count();
            assert.equal(afterCount, beforeCount + _.size(config.get(k.VideoLanguageCodes)));
        });

        it('should return the "id" of the newly created Speaker record', async function() {
            const response = await request(server).post('/speakers').send(newSpeaker).set(k.Header.Authorization, authorization);
            const maxSpeakerId = await db[k.Model.Speaker].max(k.Attr.Id);
            assert.equal(response.body[k.Attr.Id], maxSpeakerId);
        });
    });
});
