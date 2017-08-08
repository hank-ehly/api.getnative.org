/**
 * subcategory
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const Subcategory = sequelize.define(k.Model.Subcategory, {}, {
        tableName: 'subcategories',
        underscored: true,
        associations: function(models) {
            models[k.Model.Subcategory].belongsTo(models[k.Model.Category], {as: 'category'});
            models[k.Model.Subcategory].hasMany(models[k.Model.SubcategoryLocalized], {as: 'subcategories_localized'});
            models[k.Model.Subcategory].hasMany(models[k.Model.Video], {as: 'videos'});
            models[k.Model.Subcategory].hasMany(models[k.Model.WritingQuestion], {as: 'writing_questions'});
        }
    });

    Subcategory.findIdsForCategoryIdOrSubcategoryId = function(options) {
        const categoryId = options.category_id;
        const subcategoryId = options.subcategory_id;

        return new Promise((resolve, reject) => {
            if (subcategoryId) {
                resolve([subcategoryId]);
            } else if (categoryId) {
                _findIdsForCategoryId(categoryId).then(resolve).catch(reject);
            } else {
                resolve([]);
            }
        });
    };

    function _findIdsForCategoryId(categoryId) {
        return Subcategory.findAll({
            where: {category_id: categoryId},
            attributes: [k.Attr.Id]
        }).then(subcategories => {
            return _.map(subcategories, k.Attr.Id);
        });
    }

    return Subcategory;
};
