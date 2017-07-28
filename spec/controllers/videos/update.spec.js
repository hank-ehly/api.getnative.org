/**
 * update.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/07/16.
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

describe('PATCH /videos/:id', function() {
    let video;

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
    let authorization, server, db, updates;

    async function setupRequestBody(video) {
        const eLang = await db[k.Model.Language].find({where: {code: 'en'}});
        const jLang = await db[k.Model.Language].find({where: {code: 'ja'}});
        const aSubcategory = await db[k.Model.Subcategory].find();
        const aSpeaker = await db[k.Model.Speaker].find();
        return {
            subcategory_id: aSubcategory.get(k.Attr.Id),
            speaker_id: aSpeaker.get(k.Attr.Id),
            language_id: eLang.get(k.Attr.Id),
            localizations: [
                {
                    id: video.videos_localized[0][k.Attr.Id],
                    description: chance.paragraph({sentences: 2}),
                    transcript: eTranText
                },
                {
                    id: video.videos_localized[1][k.Attr.Id],
                    description: chance.paragraph({sentences: 2}),
                    transcript: jTranText
                }
            ]
        };
    }

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        const results = await SpecUtil.login(true);
        authorization = results.authorization;
        server = results.server;
        db = results.db;

        video = await db[k.Model.Video].find({
            include: {
                model: db[k.Model.VideoLocalized],
                as: 'videos_localized'
            }
        });
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

        describe('localizations', function() {
            it('should return 400 Bad Request if localizations is not an array', function() {
                updates.localizations = _.stubObject();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if localizations is 0 length', function() {
                updates.localizations = _.stubArray();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should respond with 400 Bad Request if "localizations" contains more objects than there are existing language', function() {
                const testUpdates = _.cloneDeep(updates);
                testUpdates.localizations.push(_.first(testUpdates.localizations));
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(testUpdates).set(k.Header.Authorization, authorization).expect(400);
            });
        });

        describe('localizations.id', function() {
            it('should return 400 Bad Request if localizations.id is not present', function() {
                delete _.first(updates.localizations)[k.Attr.Id];
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if localizations.id is not a number', function() {
                _.first(updates.localizations)[k.Attr.Id] = _.stubString();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if localizations.id is 0', function() {
                _.first(updates.localizations)[k.Attr.Id] = 0;
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });
        });

        describe('localizations.description', function() {
            it('should return 400 Bad Request if localizations.description is not a string', function() {
                _.first(updates.localizations).description = _.stubObject();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if localizations.description is 0 length', function() {
                _.first(updates.localizations).description = _.stubString();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });
        });

        describe('localizations.transcript', function() {
            it('should return 400 Bad Request if localizations.transcript is not a string', function() {
                _.first(updates.localizations).transcript = _.stubObject();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
            });

            it('should return 400 Bad Request if localizations.transcript is 0 length', function() {
                _.first(updates.localizations).transcript = _.stubString();
                return request(server).patch(`/videos/${video.get(k.Attr.Id)}`).set(k.Header.Authorization, authorization).send(updates).expect(400);
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

            it('should update the VideoLocalized records associated with the Video', async function() {
                await request(server).patch(`/videos/${video.get(k.Attr.Id)}`).send(updates).set(k.Header.Authorization, authorization);
                await video.reload({
                    include: {
                        model: db[k.Model.VideoLocalized],
                        as: 'videos_localized'
                    }
                });

                const id = _.first(updates.localizations)[k.Attr.Id];
                const actualDescription = _.find(video.get('videos_localized'), {id: id}).get(k.Attr.Description);
                const expectedDescription = _.find(updates.localizations, {id: id})[k.Attr.Description];

                assert.equal(actualDescription, expectedDescription);
            });
        });
    });
});
