/**
 * calculate-study-session-stats-for-language.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/25.
 */

const SpecUtil        = require('../../spec-util');
const db              = require('../../../app/models');
const k               = require('../../../config/keys.json');
const User            = db[k.Model.User];
const Video           = db[k.Model.Video];
const Credential      = db[k.Model.Credential];
const StudySession    = db[k.Model.StudySession];
const Language        = db[k.Model.Language];

const assert          = require('assert');
const chance          = require('chance').Chance();
const _               = require('lodash');
const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];

describe('User.calculateStudySessionStatsForLanguage', function() {
    let user, englishLanguageId, japaneseLanguageId, loginResults;

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
            user.calculateStudySessionStatsForLanguage();
        }, ReferenceError);
    });

    it(`should throw a TypeError if the 'lang' argument is not a valid lang code`, function() {
        assert.throws(function() {
            user.calculateStudySessionStatsForLanguage('invalid');
        }, TypeError);
    });

    it(`should return the total study time for the specified language`, function() {
        const englishStudyTime      = 300;
        const japaneseStudyTime     = 420;
        const numberOfStudySessions = 5;

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

            const englishRecords = _.times(numberOfStudySessions, function() {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: englishStudyTime,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(numberOfStudySessions, function() {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: japaneseStudyTime,
                    is_completed: true
                }
            });

            _.set(_.first(japaneseRecords), k.Attr.IsCompleted, false);

            const createEnglishStudySessions  = StudySession.bulkCreate(englishRecords);
            const createJapaneseStudySessions = StudySession.bulkCreate(japaneseRecords);

            return Promise.all([createEnglishStudySessions, createJapaneseStudySessions]);
        }).then(function() {
            return Promise.all([user.calculateStudySessionStatsForLanguage('en'), user.calculateStudySessionStatsForLanguage('ja')]);
        }).then(function(values) {
            const [e, j] = values;
            assert.equal(e.total_time_studied, englishStudyTime * numberOfStudySessions);
            assert.equal(j.total_time_studied, (japaneseStudyTime * numberOfStudySessions) - japaneseStudyTime);
        });
    });

    it(`should return the total number of study sessions for the specified language only`, function() {
        const englishStudyTime              = 300;
        const japaneseStudyTime             = 420;
        const numberOfEnglishStudySessions  = 5;
        const numberOfJapaneseStudySessions = 7;

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

            const englishRecords = _.times(numberOfEnglishStudySessions, function() {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: englishStudyTime,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(numberOfJapaneseStudySessions, function() {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: japaneseStudyTime,
                    is_completed: true
                }
            });

            _.set(_.first(englishRecords), 'is_completed', false);

            const createEnglishStudySessions  = StudySession.bulkCreate(englishRecords);
            const createJapaneseStudySessions = StudySession.bulkCreate(japaneseRecords);

            return Promise.all([createEnglishStudySessions, createJapaneseStudySessions]);
        }).then(function() {
            return Promise.all([user.calculateStudySessionStatsForLanguage('en'), user.calculateStudySessionStatsForLanguage('ja')]);
        }).then(function(values) {
            const [e, j] = values;
            assert.equal(e.total_study_sessions, numberOfEnglishStudySessions - 1);
            assert.equal(j.total_study_sessions, numberOfJapaneseStudySessions);
        });
    });

    it(`should return 0 if the user has not studied before`, function() {
        return user.calculateStudySessionStatsForLanguage('en').then(function(stats) {
            assert.equal(stats.total_time_studied, 0);
        });
    });

    it(`should return 0 if the user has not studied before`, function() {
        return user.calculateStudySessionStatsForLanguage('ja').then(function(stats) {
            assert.equal(stats.total_study_sessions, 0);
        });
    });
});
