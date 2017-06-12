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
const Subcategory = db[k.Model.Subcategory];
const services = require('../services');
const ModelHelper = services['Model'](db);
const GetNativeError = services['GetNativeError'];

const _ = require('lodash');

module.exports.show = async (req, res, next) => {
    let subcategory;

    const subcategoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.CreatedAt);
    const subcategoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.UpdatedAt);

    const subcategoryPredicate = {
        where: {id: +req.params.subcategory_id, category_id: +req.params.category_id},
        attributes: [k.Attr.Id, k.Attr.Name, subcategoryCreatedAt, subcategoryUpdatedAt]
    };

    try {
        subcategory = await Subcategory.find(subcategoryPredicate);
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
    let updateCount;

    const changeableAttributes = ['category_id'];
    const requestedChanges = _.pick(req.body, changeableAttributes);

    if (_.size(requestedChanges) === 0) {
        return res.sendStatus(304);
    }

    const subcategoryPredicate = {
        where: {id: req.params.subcategory_id, category_id: req.params.category_id}
    };

    try {
        [updateCount] = await Subcategory.update(requestedChanges, subcategoryPredicate);
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const locationCategoryId = _.defaultTo(requestedChanges.category_id, req.params.category_id);
    res.set(k.Header.Location, `/categories/${locationCategoryId}/subcategories/${req.params.subcategory_id}`);

    return res.sendStatus(204);
};
