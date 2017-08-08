/**
 * writing-questions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/07.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const WritingQuestionLocalized = db[k.Model.WritingQuestionLocalized];
const WritingQuestion = db[k.Model.WritingQuestion];
const Language = db[k.Model.Language];
const Subcategory = db[k.Model.Subcategory];
const Video = db[k.Model.Video];
const GetNativeError = require('../services')['GetNativeError'];

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let questions, video;

    try {
        video = await Video.findByPrimary(req.params[k.Attr.Id], {
            include: [{
                model: Subcategory,
                as: 'subcategory',
                attributes: [k.Attr.Id]
            }, {
                model: Language,
                as: 'language',
                attributes: [k.Attr.Code]
            }]
        });
    } catch (e) {
        return next(e);
    }

    if (!video) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    video = video.get({
        plain: true
    });

    const interfaceLanguageId = await Language.findIdForCode(video.language.code);

    const conditions = {
        where: {subcategory_id: video.subcategory[k.Attr.Id]},
        attributes: [k.Attr.Id],
        include: [
            {
                model: WritingQuestionLocalized,
                as: 'writing_questions_localized',
                attributes: [k.Attr.Text, k.Attr.ExampleAnswer],
                where: {language_id: interfaceLanguageId}
            }
        ]
    };

    if (req.query.count) {
        conditions.limit = +req.query.count;
    }

    try {
        questions = await WritingQuestion.findAll(conditions);
    } catch (e) {
        return next(e);
    }

    if (_.size(questions) === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    questions = _.invokeMap(questions, 'get', {plain: true});

    questions = _.map(questions, question => {
        question[k.Attr.Text] = _.first(question.writing_questions_localized)[k.Attr.Text];
        question[k.Attr.ExampleAnswer] = _.first(question.writing_questions_localized)[k.Attr.ExampleAnswer];
        delete question.writing_questions_localized;
        return question;
    });

    questions = _.zipObject(['records', 'count'], [questions, questions.length]);

    return res.status(200).send(questions);
};
