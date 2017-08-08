/**
 * calculate-study-streaks.spec
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

describe('User.calculateStudyStreaks', function() {
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
            user.calculateStudyStreaksForLanguage();
        }, ReferenceError);
    });

    it(`should throw a TypeError if the 'lang' argument is not a valid lang code`, function() {
        assert.throws(function() {
            user.calculateStudyStreaksForLanguage('invalid');
        }, TypeError);
    });

    it(`should return the longest number of consecutive days the user has studied for the specified language`, function() {
        const japaneseVideoPromise = Video.find({attributes: [k.Attr.Id], where: {language_id: japaneseLanguageId}});
        const englishVideoPromise  = Video.find({attributes: [k.Attr.Id], where: {language_id: englishLanguageId}});

        return Promise.all([japaneseVideoPromise, englishVideoPromise]).then(function(values) {
            let [japaneseVideo, englishVideo] = values;

            const englishStudyDates = [
                '2017-03-13 00:00:00',
                '2017-03-10 00:00:00',
                '2017-03-09 00:00:00',
                '2017-03-08 00:00:00',
                '2017-03-07 00:00:00',
                '2017-03-05 00:00:00',
                '2017-03-02 00:00:00',
                '2017-03-01 00:00:00'
            ];

            const japaneseStudyDates = [
                '2017-03-08 00:00:00',
                '2017-03-07 00:00:00',
                '2017-03-06 00:00:00',
                '2017-03-05 00:00:00',
                '2017-03-04 00:00:00',
                '2017-03-03 00:00:00',
                '2017-03-02 00:00:00',
                '2017-03-01 00:00:00'
            ];

            const englishStudySessions = _.times(englishStudyDates.length, function(i) {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    created_at: englishStudyDates[i],
                    is_completed: true
                }
            });

            const japaneseStudySessions = _.times(japaneseStudyDates.length, function(i) {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    created_at: japaneseStudyDates[i],
                    is_completed: true
                }
            });

            _.nth(japaneseStudySessions, 6)[k.Attr.IsCompleted] = false;

            return StudySession.bulkCreate(_.concat(englishStudySessions, japaneseStudySessions));
        }).then(function() {
            return Promise.all([user.calculateStudyStreaksForLanguage('en'), user.calculateStudyStreaksForLanguage('ja')]);
        }).then(function(values) {
            const [englishStats, japaneseStats] = values;
            assert.equal(englishStats.longest_consecutive_days, 4, '(English)');
            assert.equal(japaneseStats.longest_consecutive_days, 6, '(Japanese)');
        });
    });

    it(`should return the number of days the user has consecutively studied for the specified language`, function() {
        const japaneseVideoPromise = Video.find({attributes: [k.Attr.Id], where: {language_id: japaneseLanguageId}});
        const englishVideoPromise  = Video.find({attributes: [k.Attr.Id], where: {language_id: englishLanguageId}});

        return Promise.all([japaneseVideoPromise, englishVideoPromise]).then(function(values) {
            const [japaneseVideo, englishVideo] = values;

            const oneDay             = 1000 * 60 * 60 * 24;
            const now                = new Date();
            const yesterday          = new Date(now - oneDay);
            const dayBeforeYesterday = new Date(now - (oneDay * 2));

            const englishStudyDates = [
                now, yesterday, dayBeforeYesterday, '2017-03-05 00:00:00', '2017-03-02 00:00:00', '2017-03-01 00:00:00'
            ];

            const japaneseStudyDates = [
                now, '2017-03-05 00:00:00', '2017-03-02 00:00:00', '2017-03-01 00:00:00'
            ];

            const englishStudySessions = _.times(englishStudyDates.length, function(i) {
                return {
                    video_id: englishVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    created_at: englishStudyDates[i],
                    is_completed: true
                }
            });

            _.nth(englishStudySessions, 2).is_completed = false;

            const japaneseStudySessions = _.times(japaneseStudyDates.length, function(i) {
                return {
                    video_id: japaneseVideo[k.Attr.Id],
                    user_id: user[k.Attr.Id],
                    study_time: 300,
                    created_at: japaneseStudyDates[i],
                    is_completed: true
                }
            });

            return StudySession.bulkCreate(_.concat(englishStudySessions, japaneseStudySessions));
        }).then(function() {
            return Promise.all([user.calculateStudyStreaksForLanguage('en'), user.calculateStudyStreaksForLanguage('ja')]);
        }).then(function(values) {
            const [englishStats, japaneseStats] = values;
            assert.equal(englishStats.consecutive_days, 2, '(English)');
            assert.equal(japaneseStats.consecutive_days, 1, '(Japanese)');
        });
    });

    it(`should return 0 as the current streak if the user has not studied before`, function() {
        return user.calculateStudyStreaksForLanguage('en').then(function(stats) {
            assert.equal(stats.consecutive_days, 0);
        });
    });

    it(`should return 0 as the longest streak if the user has not studied before`, function() {
        return user.calculateStudyStreaksForLanguage('en').then(function(stats) {
            assert.equal(stats.longest_consecutive_days, 0);
        });
    });
});
