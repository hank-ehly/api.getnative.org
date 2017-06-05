/**
 * categories
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const Category = db[k.Model.Category];
const Subcategory = db[k.Model.Subcategory];
const services = require('../services');
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError = services['GetNativeError'];
const ModelHelper = services['Model'](db);

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let categories;

    try {
        categories = await Category.findAll({
            attributes: [k.Attr.Id, k.Attr.Name],
            include: [
                {
                    model: Subcategory,
                    as: 'subcategories',
                    attributes: [k.Attr.Id, k.Attr.Name]
                }
            ]
        });
    } catch (e) {
        return next(e);
    }

    categories = _.invokeMap(categories, 'get', {
        plain: true
    });

    categories = _.map(categories, category => {
        category.subcategories = _.zipObject(['records', 'count'], [category.subcategories, category.subcategories.length]);
        return category;
    });

    categories = _.zipObject(['records', 'count'], [categories, categories.length]);

    return res.send(categories);
};

module.exports.show = async (req, res, next) => {
    let category, subcategories;

    const categoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.CreatedAt);
    const categoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.UpdatedAt);

    try {
        category = await Category.findByPrimary(req.params[k.Attr.Id], {
            attributes: [
                k.Attr.Id, k.Attr.Name, categoryCreatedAt, categoryUpdatedAt
            ]
        });
    } catch (e) {
        return next(e);
    }

    if (!category) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    category = category.get({
        plain: true
    });

    const subcategoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.CreatedAt);
    const subcategoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.UpdatedAt);

    try {
        subcategories = await Subcategory.findAll({
            where: {
                category_id: req.params[k.Attr.Id]
            },
            attributes: [
                k.Attr.Id, k.Attr.Name, subcategoryCreatedAt, subcategoryUpdatedAt
            ]
        });
    } catch (e) {
        return next(e);
    }

    if (!subcategories) {
        subcategories = [];
    }

    category.subcategories = _.zipObject(['records', 'count'], [subcategories, subcategories.length]);

    return res.send(category);
};

module.exports.update = async (req, res, next) => {
    let updateCount;

    if (!req.body[k.Attr.Name]) {
        return res.sendStatus(304);
    }

    try {
        [updateCount] = await Category.update({
            name: req.body[k.Attr.Name]
        }, {
            where: {
                id: req.params[k.Attr.Id]
            }
        });
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.create = async (req, res, next) => {
    let category;

    try {
        category = await Category.create({
            name: req.body[k.Attr.Name]
        });
    } catch (e) {
        return next(e);
    }

    if (!category) {
        res.status(500);
        return next(new GetNativeError(k.Error.CreateResourceFailure));
    }

    res.set(k.Header.Location, `/categories/${category.get(k.Attr.Id)}`);

    return res.sendStatus(201);
};
