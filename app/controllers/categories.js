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
