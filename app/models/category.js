/**
 * category
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/23.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Category, {}, {
        tableName: 'categories',
        underscored: true,
        associations: function(models) {
            models[k.Model.Category].hasMany(models[k.Model.CategoryLocalized], {as: 'categories_localized'});
            models[k.Model.Category].hasMany(models[k.Model.Subcategory], {as: 'subcategories'});
        }
    });
};
