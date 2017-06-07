/**
 * subcategories
 * get-native.com
 *
 * Created by henryehly on 2017/05/03.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const WritingQuestion = db[k.Model.WritingQuestion];
const WritingQuestionLocalized = db[k.Model.WritingQuestionLocalized];
const Language = db[k.Model.Language];
const services = require('../services');
const ModelHelper = services['Model'](db);
const GetNativeError = services['GetNativeError'];
const Subcategory = db[k.Model.Subcategory];

const _ = require('lodash');

module.exports.writingQuestions = async (req, res, next) => {
    let questions;

    const interfaceLanguageCode = _.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code));
    const interfaceLanguageId = await Language.findIdForCode(interfaceLanguageCode);

    const conditions = {
        where: {
            subcategory_id: req.params[k.Attr.Id]
        },
        attributes: [
            k.Attr.Id
        ],
        include: [
            {
                model: WritingQuestionLocalized,
                as: 'writing_questions_localized',
                attributes: [
                    k.Attr.Text, k.Attr.ExampleAnswer
                ],
                where: {
                    language_id: interfaceLanguageId
                }
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

module.exports.show = async (req, res, next) => {
    let subcategory;

    const subcategoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.CreatedAt);
    const subcategoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.UpdatedAt);

    try {
        subcategory = await Subcategory.find({
            where: {
                id: +req.params.subcategory_id,
                category_id: +req.params.category_id
            },
            attributes: [
                k.Attr.Id, k.Attr.Name, subcategoryCreatedAt, subcategoryUpdatedAt
            ]
        });
    } catch (e) {
        return next(e);
    }

    if (!subcategory) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    subcategory = subcategory.get({
        plain: true
    });

    return res.status(200).send(subcategory);
};

module.exports.update = async (req, res, next) => {
    let updateCount, changes = {};

    if (req.body[k.Attr.Name]) {
        changes[k.Attr.Name] = req.body[k.Attr.Name];
    }

    if (req.body.category_id) {
        changes.category_id = req.body.category_id;
    }

    if (_.size(changes) === 0) {
        return res.sendStatus(304);
    }

    try {
        [updateCount] = await Subcategory.update(changes, {
            where: {
                id: req.params.subcategory_id,
                category_id: req.params.category_id
            }
        });
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const locationCategoryId = _.defaultTo(changes.category_id, req.params.category_id);
    res.set(k.Header.Location, `/categories/${locationCategoryId}/subcategories/${req.params.subcategory_id}`);

    return res.sendStatus(204);
};
