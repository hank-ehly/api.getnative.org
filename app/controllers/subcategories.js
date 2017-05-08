/**
 * subcategories
 * get-native.com
 *
 * Created by henryehly on 2017/05/03.
 */

const k = require('../../config/keys.json');
const WritingQuestion = require('../models')[k.Model.WritingQuestion];
const GetNativeError = require('../services')['GetNativeError'];

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
