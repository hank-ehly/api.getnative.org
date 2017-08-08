/**
 * delete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/16.
 */

const SpecUtil = require('../../spec-util');
const request = require('supertest');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const chance = require('chance').Chance();
const _ = require('lodash');

describe('DELETE /speakers/:id', function() {
    let authorization, speaker, server, db, genders, languages;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login(true);
        server = results.server;
        authorization = results.authorization;
        db = results.db;
        if (!genders) {
            genders = await db[k.Model.Gender].findAll();
        }
        if (!languages) {
            languages = await db[k.Model.Language].findAll();
        }
        speaker = await createMockSpeaker();
    });

    async function createMockSpeaker() {
        const speaker = await db[k.Model.Speaker].create({
            gender_id: _.sample(genders).get(k.Attr.Id)
        });

        const speakersLocalized = [];
        for (let lang of languages) {
            speakersLocalized.push({
                language_id: lang.get(k.Attr.Id),
                speaker_id: speaker.get(k.Attr.Id),
                description: chance.paragraph(),
                location: chance.city(),
                name: chance.name()
            });
        }

        await db[k.Model.SpeakerLocalized].bulkCreate(speakersLocalized);

        return await speaker.reload({
            include: {
                model: db[k.Model.SpeakerLocalized],
                as: 'speakers_localized'
            }
        });
    }

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should return 400 Bad Response if :speaker_id is not a number', function() {
            return request(server).delete(`/speakers/not_a_number`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should return 400 Bad Response if :speaker_id is 0', function() {
            return request(server).delete(`/speakers/0`).set(k.Header.Authorization, authorization).expect(400);
        });

        it('should return 422 Unprocessable Entity if the Speaker has dependent resources', async function() {
            const video = await db[k.Model.Video].find({attributes: [k.Attr.Id, k.Attr.SpeakerId]});
            const speakerWithDeps = await db[k.Model.Speaker].findByPrimary(video.get(k.Attr.SpeakerId));
            return request(server).delete(`/speakers/${speakerWithDeps.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).expect(422);
        });
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).delete(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).delete(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a valid request', function() {
            return request(server).delete(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).expect(204);
        });

        it('should delete the specified Speaker record', async function() {
            await request(server).delete(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);
            const deletedSpeaker = await db[k.Model.Speaker].findByPrimary(speaker.get(k.Attr.Id));
            assert(_.isNull(deletedSpeaker));
        });

        it('should delete the SpeakerLocalized records associated to the Speaker', async function() {
            await request(server).delete(`/speakers/${speaker.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization);

            const deletedSpeakersLocalized = await db[k.Model.SpeakerLocalized].findAll({
                where: {
                    id: {
                        $in: _.invokeMap(speaker.speakers_localized, 'get', k.Attr.Id)
                    }
                }
            });

            assert.equal(deletedSpeakersLocalized.length, 0);
        });
    });
});
