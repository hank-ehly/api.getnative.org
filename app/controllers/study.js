/**
 * study
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k               = require('../../config/keys.json');
const db              = require('../models');
const WritingAnswer   = db[k.Model.WritingAnswer];
const Language = db[k.Model.Language];
const WritingQuestion = db[k.Model.WritingQuestion];
const WritingQuestionLocalized = db[k.Model.WritingQuestionLocalized];
const QueuedVideo     = db[k.Model.CuedVideo];
const StudySession    = db[k.Model.StudySession];
const User            = db[k.Model.User];
const Video           = db[k.Model.Video];
const services        = require('../services');
const ModelService    = services['Model'](db);
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError  = services['GetNativeError'];
const Auth            = services['Auth'];

const _               = require('lodash');

module.exports.stats = (req, res, next) => {
    const sessionStats = req.user.calculateStudySessionStatsForLanguage(req.params.lang);
    const writingStats = req.user.calculateWritingStatsForLanguage(req.params.lang);
    const studyStreaks = req.user.calculateStudyStreaksForLanguage(req.params.lang);

    return Promise.all([sessionStats, writingStats, studyStreaks]).then(values => {
        const [sessions, writing, streaks] = values;
        res.status(200).send({
            lang: req.params.lang,
            total_time_studied: sessions.total_time_studied,
            consecutive_days: streaks.consecutive_days,
            total_study_sessions: sessions.total_study_sessions,
            longest_consecutive_days: streaks.longest_consecutive_days,
            maximum_words: writing.maximum_words,
            maximum_wpm: writing.maximum_wpm
        });
    }).catch(next);
};

module.exports.writing_answers = async (req, res, next) => {
    let writingAnswers;

    const createdAt = ModelService.getDateAttrForTableColumnTZOffset(k.Model.WritingAnswer, k.Attr.CreatedAt, req.query.time_zone_offset);
    const languageId = await Language.findIdForCode(req.params.lang);

    const scopes = [
        'newestFirst',
        {method: ['forUserWithLang', req.user[k.Attr.Id], req.params.lang]}
    ];

    if (req.query.since) {
        scopes.push({method: ['since', req.query.since]});
    }

    if (req.query.max_id) {
        scopes.push({method: ['maxId', req.query.max_id]});
    }

    const include = {
        model: WritingQuestion,
        as: 'writing_question',
        attributes: [k.Attr.Id],
        include: {
            model: WritingQuestionLocalized,
            as: 'writing_questions_localized',
            attributes: [k.Attr.Text],
            where: {language_id: languageId}
        }
    };

    const attributes = [k.Attr.Id, k.Attr.Answer, createdAt, k.Attr.StudySessionId];

    try {
        writingAnswers = await WritingAnswer.scope(scopes).findAll({attributes: attributes, include: include, limit: 10});
    } catch (e) {
        return next(e);
    }

    if (_.size(writingAnswers) === 0) {
        return res.send({records: [], count: 0});
    }

    writingAnswers = _.invokeMap(writingAnswers, 'get', {
        plain: true
    });

    writingAnswers = ResponseWrapper.wrap(writingAnswers.map(writingAnswer => {
        writingAnswer.lang = req.params.lang;

        writingAnswer.writing_question[k.Attr.Text] = _.first(writingAnswer.writing_question.writing_questions_localized)[k.Attr.Text];
        delete writingAnswer.writing_question.writing_questions_localized;
        delete writingAnswer.writing_question[k.Attr.Id];

        return writingAnswer;
    }));

    return res.send(writingAnswers);
};

module.exports.createStudySession = (req, res, next) => {
    const videoId   = req.body[k.Attr.VideoId];
    const studyTime = req.body[k.Attr.StudyTime];

    const queuedVideo = QueuedVideo.findOrCreate({
        where: {
            user_id: req.user[k.Attr.Id],
            video_id: videoId
        }
    });

    const studySession = StudySession.create({
        user_id: req.user[k.Attr.Id],
        video_id: videoId,
        study_time: studyTime
    });

    return Promise.all([studySession, queuedVideo]).then(function(values) {
        const [session] = values;
        const ret = _.pick(session.get({plain: true}), [k.Attr.Id, k.Attr.VideoId, k.Attr.StudyTime, k.Attr.IsCompleted]);
        res.status(201).send(ret);
    }).catch(next);
};

module.exports.complete = async (req, res, next) => {
    let updateCount;

    try {
        [updateCount] = await StudySession.update({is_completed: true}, {where: {id: req.body[k.Attr.Id]}});
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.createWritingAnswer = (req, res, next) => {
    return StudySession.findByPrimary(req.body[k.Attr.StudySessionId], {attributes: [k.Attr.StudyTime]}).then(studySession => {
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
