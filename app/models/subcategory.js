/**
 * subcategory
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const Subcategory = sequelize.define('Subcategory', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'subcategories',
        underscored: true,
        associations: function(models) {
            models.Subcategory.belongsTo(models.Category);
            models.Subcategory.hasMany(models.Video, {as: 'videos'});
            models.Subcategory.hasMany(models.WritingQuestion, {as: 'writing_questions'});
        }
    });

    Subcategory.findIdsForCategoryIdOrSubcategoryId = function(options) {
        const categoryId    = options.category_id;
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
            attributes: ['id']
        }).then(subcategories => {
            return _.map(subcategories, 'id');
        });
    }

    return Subcategory;
};
