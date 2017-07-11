/**
 * create.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/22.
 */

const SpecUtil = require('../../spec-util');
const config = require('../../../config/application').config;
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services')['Utility'];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const request = require('supertest');
const path = require('path');
const chance = require('chance').Chance();
const fs = require('fs');
const _ = require('lodash');

describe('POST /videos', function() {
    const videoFile = path.resolve(__dirname, '..', '..', 'fixtures', '1080x720.mov');
    const eDescription = chance.paragraph({sentences: 2});
    const jDescription = 'ローラという名は米国のテレビドラマ『大草原の小さな家』の登場人物「ローラ」に由来する。幼少の頃に両親が離婚。実父とともに実父の再婚相手となった中国人の継母と生活して育った。';
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
    let authorization, server, db, metadata;

    async function setupRequestMetadata() {
        const eLang = await db[k.Model.Language].find({where: {code: 'en'}});
        const jLang = await db[k.Model.Language].find({where: {code: 'ja'}});
        const aSubcategory = await db[k.Model.Subcategory].find();
        const aSpeaker = await db[k.Model.Speaker].find();
        return {
            subcategory_id: aSubcategory.get(k.Attr.Id),
            speaker_id: aSpeaker.get(k.Attr.Id),
            language_id: eLang.get(k.Attr.Id),
            descriptions: [
                {
                    language_id: eLang.get(k.Attr.Id),
                    description: eDescription
                },
                {
                    language_id: jLang.get(k.Attr.Id),
                    description: jDescription
                }
            ],
            transcripts: [
                {
                    language_id: eLang.get(k.Attr.Id),
                    text: eTranText
                }, {
                    language_id: jLang.get(k.Attr.Id),
                    text: jTranText
                }
            ]
        };
    }

    async function destroyAllVideos() {
        await db[k.Model.UsageExample].destroy({where: {}});
        await db[k.Model.CollocationOccurrence].destroy({where: {}, force: true});
        await db[k.Model.Transcript].destroy({where: {}});
        await db[k.Model.WritingAnswer].destroy({where: {}});
        await db[k.Model.StudySession].destroy({where: {}});
        await db[k.Model.Like].destroy({where: {}});
        await db[k.Model.CuedVideo].destroy({where: {}});
        await db[k.Model.VideoLocalized].destroy({where: {}, force: true});
        await db[k.Model.Video].destroy({where: {}, force: true});
    }

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await Promise.all([SpecUtil.seedAll(), SpecUtil.startMailServer()]);
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        await destroyAllVideos();
        metadata = await setupRequestMetadata();
    });

    afterEach(function(done) {
        server.close(done);
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.all([SpecUtil.seedAllUndo(), SpecUtil.stopMailServer()]);
    });

    describe('failure', function() {
        describe('video', function() {
            it('should return 400 Bad Request if the video field is missing', function() {
                return request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .field('metadata', JSON.stringify(metadata))
                    .expect(400);
            });
        });

        describe('metadata', function() {
            it('should return 400 Bad Request if the metadata field is missing', function() {
                return request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .expect(400);
            });

            it('should return 400 Bad Request if the metadata field is not a parsable JSON object', function() {
                return request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', '["foo": "bar"}')
                    .expect(400);
            });

            describe('is_public', function() {
                after(function() {
                    _.unset(metadata, k.Attr.IsPublic);
                });
                it('should return 400 Bad Request if is_public is not a boolean', function() {
                    _.set(metadata, k.Attr.IsPublic, 'notABoolean');
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });
            });

            describe('subcategory_id', function() {
                it('should return 400 Bad Request if subcategory_id is not present', function() {
                    delete metadata.subcategory_id;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if subcategory_id is not a number', function() {
                    metadata.subcategory_id = 'not_a_number';
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if subcategory_id is 0', function() {
                    metadata.subcategory_id = 0;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 404 Not Found if the subcategory_id does not correspond to an existing Subcategory record', function() {
                    metadata.subcategory_id = Math.pow(10, 5);
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(404);
                });
            });

            describe('language_id', function() {
                it('should return 400 Bad Request if language_id is not present', function() {
                    delete metadata.language_id;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if language_id is not a number', function() {
                    metadata.language_id = 'not_a_number';
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if language_id is 0', function() {
                    metadata.language_id = 0;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 404 Not Found if the language_id does not correspond to an existing Language record', function() {
                    metadata.language_id = Math.pow(10, 5);
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(404);
                });
            });

            describe('speaker_id', function() {
                it('should return 400 Bad Request if speaker_id is not present', function() {
                    delete metadata.speaker_id;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if speaker_id is not a number', function() {
                    metadata.speaker_id = 'not_a_number';
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if speaker_id is 0', function() {
                    metadata.speaker_id = 0;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 404 Not Found if the speaker_id does not correspond to an existing Speaker record', function() {
                    metadata.speaker_id = Math.pow(10, 5);
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(404);
                });
            });

            describe('descriptions', function() {
                it('should return 400 Bad Request if transcripts is not present', function() {
                    delete metadata.descriptions;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions is not an array', function() {
                    metadata.descriptions = _.stubObject();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions is 0 length', function() {
                    metadata.descriptions = _.stubArray();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });
            });

            describe('descriptions.language_id', function() {
                it('should return 400 Bad Request if descriptions.language_id is not present', function() {
                    delete _.first(metadata.descriptions).language_id;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions.language_id is not a number', function() {
                    _.first(metadata.descriptions).language_id = _.stubString();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions.language_id is 0', function() {
                    _.first(metadata.descriptions).language_id = 0;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 404 Not Found if the descriptions.language_id does not correspond to an existing Language record', function() {
                    _.first(metadata.descriptions).language_id = Math.pow(10, 5);
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(404);
                });
            });

            describe('descriptions.description', function() {
                it('should return 400 Bad Request if descriptions.description is not present', function() {
                    delete _.first(metadata.descriptions).description;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions.description is not a string', function() {
                    _.first(metadata.descriptions).description = _.stubObject();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if descriptions.description is 0 length', function() {
                    _.first(metadata.descriptions).description = _.stubString();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });
            });

            describe('transcripts', function() {
                it('should return 400 Bad Request if transcripts is not present', function() {
                    delete metadata.transcripts;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts is not an array', function() {
                    metadata.transcripts = _.stubObject();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts is 0 length', function() {
                    metadata.transcripts = _.stubArray();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });
            });

            describe('transcripts.language_id', function() {
                it('should return 400 Bad Request if transcripts.language_id is not present', function() {
                    delete _.first(metadata.transcripts).language_id;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts.language_id is not a number', function() {
                    _.first(metadata.transcripts).language_id = _.stubString();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts.language_id is 0', function() {
                    _.first(metadata.transcripts).language_id = 0;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 404 Not Found if the transcripts.language_id does not correspond to an existing Language record', function() {
                    _.first(metadata.transcripts).language_id = Math.pow(10, 5);
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(404);
                });
            });

            describe('transcripts.text', function() {
                it('should return 400 Bad Request if transcripts.text is not present', function() {
                    delete _.first(metadata.transcripts).text;
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts.text is not a string', function() {
                    _.first(metadata.transcripts).text = _.stubObject();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });

                it('should return 400 Bad Request if transcripts.text is 0 length', function() {
                    _.first(metadata.transcripts).text = _.stubString();
                    return request(server)
                        .post('/videos')
                        .set(k.Header.Authorization, authorization)
                        .attach('video', videoFile)
                        .field('metadata', JSON.stringify(metadata))
                        .expect(400);
                });
            });
        });
    });

    describe('success', function() {
        before(function() {
            fs.mkdirSync(path.resolve(config.get(k.TempDir), 'videos'));
        });

        afterEach(function() {
            const files = fs.readdirSync(path.resolve(config.get(k.TempDir), 'videos'));
            _.each(files, function(file) {
                fs.unlinkSync(path.resolve(config.get(k.TempDir), 'videos', file));
            });
        });

        after(function() {
            fs.rmdirSync(path.resolve(config.get(k.TempDir), 'videos'));
        });

        describe('request headers', function() {
            it('should respond with an X-GN-Auth-Token header', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));
                assert(_.gt(response.header[k.Header.AuthToken].length, 0));
            });

            it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));
                assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
            });

            it('should respond with 201 Created for a valid request', function() {
                this.timeout(SpecUtil.defaultTimeout);
                return request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata))
                    .expect(201);
            });
        });

        describe('data integrity', function() {
            it('should create a new Video record', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const videoCount = await db[k.Model.Video].count();
                assert.equal(videoCount, 1);
            });

            it('should create a new Video with the specified subcategory_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('subcategory_id'), metadata.subcategory_id);
            });

            it('should create a new Video with the specified language_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('language_id'), metadata.language_id);
            });

            it('should create a new Video with the specified speaker_id', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();
                assert.equal(video.get('speaker_id'), metadata.speaker_id);
            });

            it("should set the video record 'video_url' to the video url", async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();

                const actualUrl = video.get(k.Attr.VideoUrl);
                const videoIdHash = Utility.getHashForId(_.toNumber(video.get(k.Attr.Id)));
                const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/videos/${videoIdHash}.mp4`;

                assert.equal(actualUrl, expectedUrl);
            });

            it("should set the video record 'picture_url' to the picture url", async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();

                const actualUrl = video.get(k.Attr.PictureUrl);
                const videoIdHash = Utility.getHashForId(_.toNumber(video.get(k.Attr.Id)));
                const expectedUrl = `https://storage.googleapis.com/${config.get(k.GoogleCloud.StorageBucketName)}/videos/${videoIdHash}.jpg`;

                assert.equal(actualUrl, expectedUrl);
            });

            it('should create a new Video with the specified number of transcripts', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find({
                    include: {
                        model: db[k.Model.Transcript],
                        as: 'transcripts'
                    }
                });

                assert.equal(video.get('transcripts').length, metadata.transcripts.length);
            });

            it('should create new VideoLocalized records with the correct descriptions', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                let video = await db[k.Model.Video].find({
                    include: {
                        model: db[k.Model.VideoLocalized],
                        attributes: [k.Attr.Description],
                        as: 'videos_localized',
                        include: {
                            model: db[k.Model.Language],
                            attributes: [k.Attr.Code],
                            as: 'language'
                        }
                    }
                });

                video = video.get({plain: true});

                const english = _.find(video.videos_localized, {language: {code: 'en'}})[k.Attr.Description];
                const japanese = _.find(video.videos_localized, {language: {code: 'ja'}})[k.Attr.Description];

                assert.equal(english, metadata.descriptions[0].description);
                assert.equal(japanese, metadata.descriptions[1].description);
            });

            it('should create the same number of new collocation occurrence records as specified in the combined transcript text', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

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

            it('should set the video "is_public" to false by default', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();
                assert.equal(video[k.Attr.IsPublic], false);
            });

            it('should set the video "is_public" to true if specified', async function() {
                after(function() {
                    _.unset(metadata, k.Attr.IsPublic);
                });

                this.timeout(SpecUtil.defaultTimeout);

                _.set(metadata, k.Attr.IsPublic, true);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();
                assert.equal(video[k.Attr.IsPublic], true);
            });

            it('should return the ID of the newly created video', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                const response = await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();

                assert.equal(response.body[k.Attr.Id], video.get(k.Attr.Id));
            });
        });

        describe('Google Cloud Storage', function() {
            it('should save a new video asset with the appropriate hash title to Google Cloud Storage', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();

                const expectedHash = Utility.getHashForId(video.get(k.Attr.Id));
                const videoPath = path.resolve(config.get(k.TempDir), 'videos', expectedHash + config.get(k.VideoFileExtension));

                assert(fs.existsSync(videoPath));
            });

            it('should save a new picture asset with the appropriate hash title to Google Cloud Storage', async function() {
                this.timeout(SpecUtil.defaultTimeout);
                await request(server)
                    .post('/videos')
                    .set(k.Header.Authorization, authorization)
                    .attach('video', videoFile)
                    .field('metadata', JSON.stringify(metadata));

                const video = await db[k.Model.Video].find();

                const expectedHash = Utility.getHashForId(video.get(k.Attr.Id));
                const imagePath = path.resolve(config.get(k.TempDir), 'videos', expectedHash + config.get(k.ImageFileExtension));

                assert(fs.existsSync(imagePath));
            });
        });
    });
});
