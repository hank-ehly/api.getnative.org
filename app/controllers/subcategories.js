/**
 * subcategories
 * get-native.com
 *
 * Created by henryehly on 2017/05/03.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const WritingQuestion = db[k.Model.WritingQuestion];
const services = require('../services');
const ModelHelper = services['Model'](db);
const GetNativeError = services['GetNativeError'];
const Subcategory = db[k.Model.Subcategory];

const _ = require('lodash');

module.exports.writingQuestions = (req, res, next) => {
    const conditions = {
        where: {
            subcategory_id: req.params[k.Attr.Id]
        },
        attributes: [
            k.Attr.Id, k.Attr.Text, k.Attr.ExampleAnswer
        ]
    };

    if (req.query.count) {
        conditions.limit = +req.query.count;
    }

    return WritingQuestion.findAll(conditions).then(questions => {
        const json = _.invokeMap(questions, 'get', {plain: true});
        const body = _.zipObject(['records', 'count'], [json, json.length]);
        res.status(200).send(body);
    }).catch(next);
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
