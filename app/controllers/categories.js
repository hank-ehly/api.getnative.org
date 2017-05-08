/**
 * categories
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const models          = require('../models');
const Category        = models.Category;
const Subcategory     = models.Subcategory;
const ResponseWrapper = require('../services').ResponseWrapper;
const k               = require('../../config/keys.json');

module.exports.index = (req, res, next) => {
    Category.findAll({
        attributes: [k.Attr.Id, k.Attr.Name],
        include: [{model: Subcategory, as: 'subcategories', attributes: [k.Attr.Id, k.Attr.Name]}]
    }).then(categories => {
        const categoriesAsJson = ResponseWrapper.deepWrap(categories.map(c => c.get({plain: true})), ['subcategories']);
        res.send(categoriesAsJson);
    }).catch(next);
};
