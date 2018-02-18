/**
 * update.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/16.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services/utility');
const youtube = require('../../../app/services/youtube');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const chance = require('chance').Chance();
const fs = require('fs');
const _ = require('lodash');

describe('PATCH /videos/:id', function() {
    let video, authorization, server, db, updates, jLang;
    const japaneseSampleText = 'Japanese writing question 1 text', japaneseSampleAnswer = 'Japanese writing question 1 example answer';

    async function setupRequestBody(video) {
        const eLang = await db[k.Model.Language].find({where: {code: 'en'}});
        jLang = await db[k.Model.Language].find({where: {code: 'ja'}});
        const aSubcategory = await db[k.Model.Subcategory].find();
        const aSpeaker = await db[k.Model.Speaker].find();
        return {
            subcategory_id: aSubcategory.get(k.Attr.Id),
            speaker_id: aSpeaker.get(k.Attr.Id),
            language_id: eLang.get(k.Attr.Id),
            localizations: [
                {
                    language_id: eLang.get(k.Attr.Id),
                    writing_questions: [
                        {
                            text: 'English writing question 1 text',
                            example_answer: 'English writing question 1 example answer'
                        },
                        {
                            text: 'English writing question 2 text',
                            example_answer: 'English writing question 2 example answer'
                        }
                    ]
                },
                {
                    language_id: jLang.get(k.Attr.Id),
                    writing_questions: [
                        {
                            text: japaneseSampleText,
                            example_answer: japaneseSampleAnswer
                        }
                    ]
                }
            ]
        };
    }

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        youtube.videosList = function(idx) {
            return Promise.resolve(null);
        };

        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        video = await db[k.Model.Video].find();
        updates = await setupRequestBody(video);
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        describe('is_public', function() {
            after(function() {
                _.unset(updates, k.Attr.IsPublic);
            });

            it('should return 400 Bad Request if is_public is not a boolean', function() {
                _.set(updates, k.Attr.IsPublic, 'notABoolean');
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });
        });

        describe('subcategory_id', function() {
            it('should return 400 Bad Request if subcategory_id is not a number', function() {
                updates.subcategory_id = 'not_a_number';
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if subcategory_id is 0', function() {
                updates.subcategory_id = 0;
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 404 Not Found if the subcategory_id does not correspond to an existing Subcategory record', async function() {
                updates.subcategory_id = Math.pow(10, 5);
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(404);
            });
        });

        describe('language_id', function() {
            it('should return 400 Bad Request if language_id is not a number', function() {
                updates.language_id = 'not_a_number';
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if language_id is 0', function() {
                updates.language_id = 0;
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 404 Not Found if the language_id does not correspond to an existing Language record', function() {
                updates.language_id = Math.pow(10, 5);
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(404);
            });
        });

        describe('speaker_id', function() {
            it('should return 400 Bad Request if speaker_id is not a number', function() {
                updates.speaker_id = 'not_a_number';
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if speaker_id is 0', function() {
                updates.speaker_id = 0;
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 404 Not Found if the speaker_id does not correspond to an existing Video record', function() {
                updates.speaker_id = Math.pow(10, 5);
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(404);
            });
        });

        describe('localizations.writing_questions', function() {
            it('should return 400 Bad Request if localizations.writing_questions is not an array', function() {
                updates.localizations[0].writing_questions = {};
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(400);
            });
        });

        describe('localizations.writing_questions.text', function() {
            it('should return 400 Bad Request if localizations.writing_questions.text is not a string', function() {
                updates.localizations[0].writing_questions[0].text = {};
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should return 400 Bad Request if localizations.writing_questions.text is 0 length', function() {
                updates.localizations[0].writing_questions[0].text = '';
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(400);
            });
        });

        describe('localizations.writing_questions.example_answer', function() {
            it('should return 400 Bad Request if localizations.writing_questions.example_answer is not a string', function() {
                updates.localizations[0].writing_questions[0].example_answer = {};
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(400);
            });

            it('should return 400 Bad Request if localizations.writing_questions.example_answer is 0 length', function() {
                updates.localizations[0].writing_questions[0].example_answer = '';
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization).expect(400);
            });
        });
    });

    describe('success', function() {
        describe('request headers', function() {
            it('should respond with an X-GN-Auth-Token header', async function() {
                const response = await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates);
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });

            it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
                const response = await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates);
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });

            it('should respond with 204 Created for a valid request', function() {
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(204);
            });

            it('should respond with 304 if the request body is empty', function() {
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send({}).expect(304);
            });
        });

        describe('data integrity', function() {
            it('should update the Video record', async function() {
                await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
                await video.reload();
                assert.equal(video.get(k.Attr.SubcategoryId), updates.subcategory_id);
            });

            it('should create the appropriate number of writing_questions records', async function() {
                // this.timeout(SpecUtil.defaultTimeout);
                // const beforeCount = await db[k.Model.WritingQuestion].count();
                // await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
                // const afterCount = await db[k.Model.WritingQuestion].count();
                // assert(afterCount === (beforeCount + 3));
                assert(false); // todo
            });

            it('should delete the appropriate number of writing_questions records', async function() {
                assert(false); // todo
            });

            it('should set the appropriate text attribute value of the writing_questions record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
                const count = await db[k.Model.WritingQuestionLocalized].count({where: {text: japaneseSampleText}});
                assert.equal(count, 1);
            });

            it('should set the appropriate example_answer attribute value of the writing_questions record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
                const count = await db[k.Model.WritingQuestionLocalized].count({where: {example_answer: japaneseSampleAnswer}});
                assert.equal(count, 1);
            });
        });
    });
});
