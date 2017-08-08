/**
 * category-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.CategoryLocalized, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'categories_localized',
        underscored: true,
        associations: function(models) {
            models[k.Model.CategoryLocalized].belongsTo(models[k.Model.Category], {as: 'category'});
            models[k.Model.CategoryLocalized].belongsTo(models[k.Model.Language], {as: 'language'});
        }
    });
};
