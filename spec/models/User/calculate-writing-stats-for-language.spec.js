/**
 * calculate-writing-stats-for-language.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/25.
 */

const SpecUtil        = require('../../spec-util');
const db              = require('../../../app/models');
const k               = require('../../../config/keys.json');
const User            = db[k.Model.User];
const Video           = db[k.Model.Video];
const WritingAnswer   = db[k.Model.WritingAnswer];
const WritingQuestion = db[k.Model.WritingQuestion];
const Credential      = db[k.Model.Credential];
const StudySession    = db[k.Model.StudySession];
const Language        = db[k.Model.Language];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert          = require('assert');
const chance          = require('chance').Chance();
const _               = require('lodash');

describe('User.calculateWritingStatsForLanguage', function() {
    let user, loginResults, englishLanguageId, japaneseLanguageId;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll().then(function() {
            return Language.findAll({attributes: [k.Attr.Code, k.Attr.Id]});
        }).then(function(languages) {
            languages = _.invokeMap(languages, 'get', {plain: true});
            englishLanguageId = _.find(languages, {code: 'en'})[k.Attr.Id];
            japaneseLanguageId = _.find(languages, {code: 'ja'})[k.Attr.Id];
        });
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        loginResults = await SpecUtil.login();
        const language = await Language.find();
        user = await User.create({
            default_study_language_id: language.get(k.Attr.Id),
            interface_language_id: language.get(k.Attr.Id),
            email: chance.email()
        });
        return Credential.create({user_id: user.get(k.Attr.Id)});
    });

    afterEach(function(done) {
        loginResults.server.close(done);
    });

    it(`should throw a ReferenceError if no 'lang' is provided`, function() {
        assert.throws(function() {
            user.calculateWritingStatsForLanguage();
        }, ReferenceError);
    });

    it(`should throw a TypeError if the 'lang' argument is not a valid lang code`, function() {
        assert.throws(function() {
            user.calculateWritingStatsForLanguage('invalid');
        }, TypeError);
    });

    it(`should return the maximum number of words the user has written in a single study session for the specified language`, function() {
        const numberOfStudySessions = 2;

        const englishVideoPromise  = Video.find({attributes: [k.Attr.Id], where: {language_id: englishLanguageId}});
        const japaneseVideoPromise = Video.find({attributes: [k.Attr.Id], where: {language_id: japaneseLanguageId}});

        return Promise.all([englishVideoPromise, japaneseVideoPromise]).then(function(values) {
            const [englishVideo, japaneseVideo] = values;

            const englishRecords = _.times(numberOfStudySessions, function() {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(numberOfStudySessions, function() {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    is_completed: true
                }
            });

            _.set(_.last(japaneseRecords), 'is_completed', false);

            const createEnglishStudySessions  = StudySession.bulkCreate(englishRecords);
            const createJapaneseStudySessions = StudySession.bulkCreate(japaneseRecords);

            return Promise.all([createEnglishStudySessions, createJapaneseStudySessions, WritingQuestion.find()]);
        }).then(function(values) {
            const [englishStudySessions, japaneseStudySessions, writingQuestion] = values;
            const writingQuestionId = writingQuestion.get(k.Attr.Id);
            const word = _.constant('word ');

            const englishAnswer_1 = {
                answer: _.times(100, word).join(''),
                study_session_id: _.first(englishStudySessions).get(k.Attr.Id),
                words_per_minute: 20,
                word_count: 100,
                writing_question_id: writingQuestionId
            };

            const englishAnswer_2 = _.assign(_.clone(englishAnswer_1), {
                answer: _.times(200, word).join(''),
                study_session_id: _.nth(englishStudySessions, 1).get(k.Attr.Id),
                words_per_minute: 40,
                word_count: 200
            });

            const japaneseAnswer_1 = {
                answer: _.times(300, word).join(''),
                study_session_id: _.first(japaneseStudySessions).get(k.Attr.Id),
                words_per_minute: 60,
                word_count: 300,
                writing_question_id: writingQuestionId
            };

            const japaneseAnswer_2 = _.assign(_.clone(japaneseAnswer_1), {
                answer: _.times(400, word).join(''),
                study_session_id: _.nth(japaneseStudySessions, 1).get(k.Attr.Id),
                words_per_minute: 80,
                word_count: 400
            });

            return WritingAnswer.bulkCreate([
                englishAnswer_1, englishAnswer_2, japaneseAnswer_1, japaneseAnswer_2
            ]);
        }).then(function() {
            return Promise.all([user.calculateWritingStatsForLanguage('en'), user.calculateWritingStatsForLanguage('ja')]);
        }).then(function(values) {
            const [e, j] = values;
            assert.equal(e.maximum_words, 200, 'English');
            assert.equal(j.maximum_words, 300, 'Japanese');
        });
    });

    it(`should return the WPM of the writing answer in the specified language with the most words for the user`, function() {
        const englishVideoPromise = Video.find({
            attributes: [k.Attr.Id],
            where: {language_id: englishLanguageId}
        });

        const japaneseVideoPromise = Video.find({
            attributes: [k.Attr.Id],
            where: {language_id: japaneseLanguageId}
        });

        return Promise.all([englishVideoPromise, japaneseVideoPromise]).then(function(values) {
            const [englishVideo, japaneseVideo] = values;

            const englishRecords = _.times(2, function() {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(2, function() {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    is_completed: true
                }
            });

            _.set(_.nth(englishRecords, 1), 'is_completed', false);

            const createEnglishStudySessions  = StudySession.bulkCreate(englishRecords);
            const createJapaneseStudySessions = StudySession.bulkCreate(japaneseRecords);

            return Promise.all([createEnglishStudySessions, createJapaneseStudySessions, WritingQuestion.find()]);
        }).then(function(values) {
            const [englishStudySessions, japaneseStudySessions, writingQuestion] = values;
            const writingQuestionId = writingQuestion.get(k.Attr.Id);
            const word = _.constant('word ');

            const englishAnswer_1 = {
                answer: _.times(100, word).join(''),
                study_session_id: _.first(englishStudySessions).get(k.Attr.Id),
                words_per_minute: 20,
                word_count: 100,
                writing_question_id: writingQuestionId
            };

            const englishAnswer_2 = _.assign(_.clone(englishAnswer_1), {
                answer: _.times(200, word).join(''),
                study_session_id: _.nth(englishStudySessions, 1).get(k.Attr.Id),
                words_per_minute: 40,
                word_count: 200
            });

            const japaneseAnswer_1 = {
                answer: _.times(300, word).join(''),
                study_session_id: _.first(japaneseStudySessions).get(k.Attr.Id),
                words_per_minute: 60,
                word_count: 300,
                writing_question_id: writingQuestionId
            };

            const japaneseAnswer_2 = _.assign(_.clone(japaneseAnswer_1), {
                answer: _.times(400, word).join(''),
                study_session_id: _.nth(japaneseStudySessions, 1).get(k.Attr.Id),
                words_per_minute: 80,
                word_count: 400
            });

            return WritingAnswer.bulkCreate([englishAnswer_1, englishAnswer_2, japaneseAnswer_1, japaneseAnswer_2]);
        }).then(function() {
            return Promise.all([user.calculateWritingStatsForLanguage('en'), user.calculateWritingStatsForLanguage('ja')]);
        }).then(function(values) {
            const [e, j] = values;
            assert.equal(e.maximum_wpm, 20, 'English');
            assert.equal(j.maximum_wpm, 80, 'Japanese');
        });
    });

    it(`should return 0 WPM if the user has not studied before`, function() {
        return user.calculateWritingStatsForLanguage('en').then(function(stats) {
            assert.equal(stats.maximum_wpm, 0);
        });
    });

    it(`should return 0 as the maximum number of words if the user has not studied before`, function() {
        return user.calculateWritingStatsForLanguage('en').then(function(stats) {
            assert.equal(stats.maximum_words, 0);
        });
    });
});
