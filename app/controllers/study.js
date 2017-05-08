/**
 * study
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k               = require('../../config/keys.json');
const db              = require('../models');
const WritingAnswer   = db[k.Model.WritingAnswer];
const WritingQuestion = db[k.Model.WritingQuestion];
const QueuedVideo     = db[k.Model.CuedVideo];
const StudySession    = db[k.Model.StudySession];
const Account         = db[k.Model.Account];
const Video           = db[k.Model.Video];
const services        = require('../services');
const ModelService    = services['Model'](db);
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError  = services['GetNativeError'];
const Auth            = services['Auth'];

const Promise         = require('bluebird');
const _               = require('lodash');

module.exports.stats = (req, res, next) => {
    Account.findById(req.accountId).then(account => {
        if (!account) {
            throw new GetNativeError(k.Error.AccountMissing);
        }

        const sessionStats = account.calculateStudySessionStatsForLanguage(req.params.lang);
        const writingStats = account.calculateWritingStatsForLanguage(req.params.lang);
        const studyStreaks = account.calculateStudyStreaksForLanguage(req.params.lang);

        return Promise.join(sessionStats, writingStats, studyStreaks, (sessions, writing, streaks) => {
            res.status(200).send({
                lang: req.params.lang,
                total_time_studied: sessions.total_time_studied,
                consecutive_days: streaks.consecutive_days,
                total_study_sessions: sessions.total_study_sessions,
                longest_consecutive_days: streaks.longest_consecutive_days,
                maximum_words: writing.maximum_words,
                maximum_wpm: writing.maximum_wpm
            });
        }).catch(Promise.reject);
    }).catch(next);
};

module.exports.writing_answers = (req, res, next) => {
    const createdAt = ModelService.getDateAttrForTableColumnTZOffset(k.Model.WritingAnswer, k.Attr.CreatedAt, req.query.time_zone_offset);

    WritingAnswer.scope([
        'newestFirst',
        {method: ['forAccountWithLang', req.accountId, req.params.lang]},
        {method: ['since', req.query.since]},
        {method: ['maxId', req.query.max_id]}
    ]).findAll({
        attributes: [k.Attr.Id, k.Attr.Answer, createdAt, k.Attr.StudySessionId],
        include: [
            {
                model: WritingQuestion,
                as: 'writing_question',
                attributes: ['text']
            }
        ],
        limit: 10
    }).then(answers => {
        const answersAsJson = ResponseWrapper.wrap(answers.map(a => {
            let json = a.get({plain: true});
            json.lang = req.params.lang;
            return json;
        }));

        res.send(answersAsJson);
    }).catch(next);
};

module.exports.createStudySession = (req, res, next) => {
    const videoId = req.body[k.Attr.VideoId];
    const studyTime    = req.body[k.Attr.StudyTime];

    const queuedVideo = QueuedVideo.findOrCreate({
        where: {
            account_id: req.accountId,
            video_id: videoId
        }
    });

    const studySession = StudySession.create({
        account_id: req.accountId,
        video_id: videoId,
        study_time: studyTime
    });

    return Promise.join(studySession, queuedVideo, function(session) {
        const ret = _.pick(session.get({plain: true}), [k.Attr.Id, k.Attr.VideoId, k.Attr.StudyTime, k.Attr.IsCompleted]);
        res.status(201).send(ret);
    }).catch(next);
};

module.exports.complete = (req, res, next) => {
    StudySession.update({is_completed: true}, {where: {id: req.body.id}}).then(function() {
        res.sendStatus(204);
    }).catch(next);
};

module.exports.createWritingAnswer = (req, res, next) => {
    return StudySession.findById(req.body[k.Attr.StudySessionId], {attributes: [k.Attr.StudyTime]}).then(studySession => {
        const minutes = ((studySession.get(k.Attr.StudyTime) / 4) / 60);
        const wordCount = req.body[k.Attr.WordCount];
        const wordsPerMinute = _.round(wordCount / minutes);
        return WritingAnswer.create({
            study_session_id: req.body[k.Attr.StudySessionId],
            writing_question_id: req.body[k.Attr.WritingQuestionId],
            word_count: wordCount,
            words_per_minute: wordsPerMinute,
            answer: req.body[k.Attr.Answer]
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(next);
};
