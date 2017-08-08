/**
 * subcategory-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.SubcategoryLocalized, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'subcategories_localized',
        underscored: true,
        associations: function(models) {
            models[k.Model.SubcategoryLocalized].belongsTo(models[k.Model.Subcategory], {as: 'subcategory'});
            models[k.Model.SubcategoryLocalized].belongsTo(models[k.Model.Language], {as: 'language'});
        }
    });
};
