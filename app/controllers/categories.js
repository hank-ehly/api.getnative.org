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
const ResponseWrapper = require('../services')['ResponseWrapper'];

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

    res.send(categories);
};
