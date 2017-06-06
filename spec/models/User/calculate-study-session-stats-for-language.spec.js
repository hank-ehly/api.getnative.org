/**
 * calculate-study-session-stats-for-language.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/25.
 */

const SpecUtil        = require('../../spec-util');
const db              = require('../../../app/models');
const k               = require('../../../config/keys.json');
const User            = db[k.Model.User];
const Video           = db[k.Model.Video];
const WritingAnswer   = db[k.Model.WritingAnswer];
const Credential      = db[k.Model.Credential];
const StudySession    = db[k.Model.StudySession];
const Language        = db[k.Model.Language];

const Promise         = require('bluebird');
const assert          = require('assert');
const chance          = require('chance').Chance();
const _               = require('lodash');
const mocha           = require('mocha');
const beforeEach      = mocha.beforeEach;
const afterEach       = mocha.afterEach;
const describe        = mocha.describe;
const before          = mocha.before;
const after           = mocha.after;
const it              = mocha.it;

describe('User.calculateStudySessionStatsForLanguage', function() {
    let user = null;
    let englishLanguageId = null;
    let japaneseLanguageId = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAll(), SpecUtil.startMailServer(), function() {
            return Language.findAll({attributes: [k.Attr.Code, k.Attr.Id]});
        }).then(function(languages) {
            languages = _.invokeMap(languages, 'get', {plain: true});
            englishLanguageId = _.find(languages, {code: 'en'})[k.Attr.Id];
            japaneseLanguageId = _.find(languages, {code: 'ja'})[k.Attr.Id];
        });
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Language.find().then(function(language) {
            return User.create({
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id),
                email: chance.email()
            });
        }).then(function(_user) {
            user = _user;
            return Credential.create({user_id: user.get(k.Attr.Id)});
        });
    });

    after(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Promise.join(SpecUtil.seedAllUndo(), SpecUtil.stopMailServer());
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

        return Promise.join(englishVideoPromise, japaneseVideoPromise, function(englishVideo, japaneseVideo) {
            const englishRecords = _.times(numberOfStudySessions, function(i) {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: englishStudyTime,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(numberOfStudySessions, function(i) {
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
        }).spread(function(e, j) {
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

        return Promise.all([englishVideoPromise, japaneseVideoPromise]).spread(function(englishVideo, japaneseVideo) {
            const englishRecords = _.times(numberOfEnglishStudySessions, function(i) {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: englishStudyTime,
                    is_completed: true
                }
            });

            const japaneseRecords = _.times(numberOfJapaneseStudySessions, function(i) {
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
        }).spread(function(e, j) {
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
