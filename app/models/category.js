/**
 * category
 * get-native.com
 *
 * Created by henryehly on 2017/02/23.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'categories',
        underscored: true,
        associations: function(models) {
            models.Category.hasMany(models.Subcategory, {as: 'subcategories'});
        }
    });
};
