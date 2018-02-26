/**
 * create.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/22.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services')['Utility'];
const youtube = require('../../../app/services/youtube');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const chance = require('chance').Chance();
const fs = require('fs');
const _ = require('lodash');

describe('POST /videos', function() {
    const japaneseSampleText = 'Japanese writing question 1 text', japaneseSampleAnswer = 'Japanese writing question 1 example answer';
    let authorization, server, db, body, jLang;

    const eTranText = `
        I actually have {a number of} different hobbies. Uhm, {first off} there's music. 
        I grew up in a pretty musical family and my grandpa is actually a famous conductor, 
        so I've been doing music or at least I've been around music {since I was a little kid}. 
        I play the drums and I actually went to school in Nashville Tennessee {for a bit} to study 
        percussion before switching over to my.. to the school I graduated from which is the University of Kansas. 
        {I have a passion for} learning languages as well. I can speak a couple different ones including Japanese and Spanish. 
        {Other than that}, I enjoy programming too. Uhm, particularly web-related stuff. Backend is more {what I'm into}.
    `;
    const jTranText = `
        久しぶりに家族に会いに行きました。一週間半くらい会社休んでアメリカに行った。お母さんとが空港まで迎えに来てくれた。その後家に帰ってスープを作ってくれた。
        お父さんが午後6時くらいに仕事から帰って来て、3人で色々とお話ができた。家族と過ごすことはとても大切ですけど、あまりにも家族のそばにいようとすると自分自身で
        物事を考えて独立して生活できなくなる危険性もあると思います。私は元々アメリカに住んでいたが、二十歳で日本に引っ越したのです。日本はいい国だが、人はアメリカより
        排他的で、孤独になりやすいタイプだと思います。
    `;

    async function setupRequestBody() {
        const eLang = await db[k.Model.Language].find({where: {code: 'en'}});
        jLang = await db[k.Model.Language].find({where: {code: 'ja'}});
        const aSubcategory = await db[k.Model.Subcategory].find();
        const aSpeaker = await db[k.Model.Speaker].find();
        return {
            youtube_video_id: 'ri6Pip_w6HM',
            subcategory_id: aSubcategory.get(k.Attr.Id),
            speaker_id: aSpeaker.get(k.Attr.Id),
            language_id: eLang.get(k.Attr.Id),
            localizations: [
                {
                    language_id: eLang.get(k.Attr.Id),
                    transcript: eTranText,
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
                    transcript: jTranText,
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

    async function destroyAllVideos() {
        await db[k.Model.WritingQuestionLocalized].destroy({where: {}});
        await db[k.Model.WritingAnswer].destroy({where: {}});
        await db[k.Model.WritingQuestion].destroy({where: {}});
        await db[k.Model.UsageExample].destroy({where: {}});
        await db[k.Model.CollocationOccurrence].destroy({where: {}, force: true});
        await db[k.Model.Transcript].destroy({where: {}});
        await db[k.Model.StudySession].destroy({where: {}});
        await db[k.Model.Like].destroy({where: {}, force: true});
        await db[k.Model.CuedVideo].destroy({where: {}});
        await db[k.Model.Video].destroy({where: {}, force: true});
    }

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        youtube.videosList = function(idx) {
            return Promise.resolve({
                items: _.times(idx.length, _.constant({
                    id: 'ri6Pip_w6HM',
                    contentDetails: {duration: 'PT1M3S'},
                    statistics: {viewCount: '13438'}
                }))
            });
        };

        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        await destroyAllVideos();
        body = await setupRequestBody();
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        describe('is_public', function() {
            after(function() {
                _.unset(body, k.Attr.IsPublic);
            });

            it('should return 400 Bad Request if is_public is not a boolean', function() {
                _.set(body, k.Attr.IsPublic, 'notABoolean');
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('subcategory_id', function() {
            it('should return 400 Bad Request if subcategory_id is not present', function() {
                delete body.subcategory_id;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if subcategory_id is not a number', function() {
                body.subcategory_id = 'not_a_number';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if subcategory_id is 0', function() {
                body.subcategory_id = 0;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 404 Not Found if the subcategory_id does not correspond to an existing Subcategory record', function() {
                body.subcategory_id = Math.pow(10, 5);
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(404);
            });
        });

        describe('language_id', function() {
            it('should return 400 Bad Request if language_id is not present', function() {
                delete body.language_id;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if language_id is not a number', function() {
                body.language_id = 'not_a_number';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if language_id is 0', function() {
                body.language_id = 0;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 404 Not Found if the language_id does not correspond to an existing Language record', function() {
                body.language_id = Math.pow(10, 5);
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(404);
            });
        });

        describe('speaker_id', function() {
            it('should return 400 Bad Request if speaker_id is not present', function() {
                delete body.speaker_id;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if speaker_id is not a number', function() {
                body.speaker_id = 'not_a_number';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if speaker_id is 0', function() {
                body.speaker_id = 0;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 404 Not Found if the speaker_id does not correspond to an existing Speaker record', function() {
                body.speaker_id = Math.pow(10, 5);
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(404);
            });
        });

        describe('youtube_video_id', function() {
            it('should return 400 Bad Request if youtube_video_id is not present', function() {
                delete body.youtube_video_id;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if youtube_video_id is not a string', function() {
                body.youtube_video_id = 123;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('localizations', function() {
            it('should return 400 Bad Request if localizations is not present', function() {
                delete body.localizations;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations is not an array', function() {
                body.localizations = {};
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations is 0 length', function() {
                body.localizations = _.stubArray();
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('localizations.language_id', function() {
            it('should return 400 Bad Request if localizations.language_id is not present', function() {
                delete _.first(body.localizations).language_id;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.language_id is not a number', function() {
                _.first(body.localizations).language_id = '';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.language_id is 0', function() {
                _.first(body.localizations).language_id = 0;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 404 Not Found if the localizations.language_id does not correspond to an existing Language record', function() {
                _.first(body.localizations).language_id = Math.pow(10, 5);
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(404);
            });
        });

        describe('localizations.transcript', function() {
            it('should return 400 Bad Request if localizations.transcript is not present', function() {
                delete _.first(body.localizations).transcript;
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.transcript is not a string', function() {
                _.first(body.localizations).transcript = {};
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.transcript is 0 length', function() {
                _.first(body.localizations).transcript = '';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('localizations.writing_questions', function() {
            it('should return 400 Bad Request if localizations.writing_questions is not an array', function() {
                body.localizations[0].writing_questions = {};
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('localizations.writing_questions.text', function() {
            it('should return 400 Bad Request if localizations.writing_questions.text is not a string', function() {
                body.localizations[0].writing_questions[0].text = {};
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.writing_questions.text is 0 length', function() {
                body.localizations[0].writing_questions[0].text = '';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });

        describe('localizations.writing_questions.example_answer', function() {
            it('should return 400 Bad Request if localizations.writing_questions.example_answer is not a string', function() {
                body.localizations[0].writing_questions[0].example_answer = {};
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });

            it('should return 400 Bad Request if localizations.writing_questions.example_answer is 0 length', function() {
                body.localizations[0].writing_questions[0].example_answer = '';
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(400);
            });
        });
    });

    describe('success', function() {
        describe('request headers', function() {
            it('should respond with an X-GN-Auth-Token header', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });

            it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });

            it('should respond with 201 Created for a valid request', function() {
                this.timeout(SpecUtil.defaultTimeout);
                return request(server).post('/videos').set(k.Header.Authorization, authorization).send(body).expect(201);
            });
        });

        describe('data integrity', function() {
            it('should create a new Video record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const videoCount = await db[k.Model.Video].count();
                assert.equal(videoCount, 1);
            });

            it('should create a new Video with the specified subcategory_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('subcategory_id'), body.subcategory_id);
            });

            it('should create a new Video with the specified language_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('language_id'), body.language_id);
            });

            it('should create a new Video with the specified speaker_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('speaker_id'), body.speaker_id);
            });

            it('should create a new Video with the specified number of transcripts', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find({
                    include: {
                        model: db[k.Model.Transcript],
                        as: 'transcripts'
                    }
                });

                assert.equal(video.get('transcripts').length, body.localizations.length);
            });

            it('should create the same number of new collocation occurrence records as specified in the combined transcript text', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find({
                    include: {
                        model: db[k.Model.Transcript],
                        as: 'transcripts',
                        include: {
                            model: db[k.Model.CollocationOccurrence],
                            as: 'collocation_occurrences'
                        }
                    }
                });

                assert.equal(_.first(video.get('transcripts'))['collocation_occurrences'].length, eTranText.match(/{/g).length);
            });

            it('should create the appropriate number of writing_questions records', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const beforeCount = await db[k.Model.WritingQuestion].count();
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                const afterCount = await db[k.Model.WritingQuestion].count();
                assert(afterCount === (beforeCount + 3));
            });

            it('should set the appropriate text attribute value of the writing_questions record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                const count = await db[k.Model.WritingQuestionLocalized].count({where: {text: japaneseSampleText}});
                assert.equal(count, 1);
            });

            it('should set the appropriate example_answer attribute value of the writing_questions record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                const count = await db[k.Model.WritingQuestionLocalized].count({where: {example_answer: japaneseSampleAnswer}});
                assert.equal(count, 1);
            });

            it('should set the video "is_public" to false by default', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find();
                assert.equal(video[k.Attr.IsPublic], false);
            });

            it('should set the video "is_public" to true if specified', async function() {
                after(function() {
                    _.unset(body, k.Attr.IsPublic);
                });

                this.timeout(SpecUtil.defaultTimeout);

                _.set(body, k.Attr.IsPublic, true);
                await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);

                const video = await db[k.Model.Video].find();
                assert.equal(video[k.Attr.IsPublic], true);
            });

            it('should return the ID of the newly created video', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server).post('/videos').set(k.Header.Authorization, authorization).send(body);
                const video = await db[k.Model.Video].find();
                assert.equal(response.body[k.Attr.Id], video.get(k.Attr.Id));
            });
        });
    });
});
