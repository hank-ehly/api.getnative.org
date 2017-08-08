/**
 * 20170226230740-subcategories
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/27.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const categories = await db[k.Model.Category].findAll(), subcategories = [];

        for (let i = 0; i < categories.length; i++) {
            let subcategoriesCount = _.random(3, 5);
            for (let j = 0; j < subcategoriesCount; j++) {
                subcategories.push({
                    category_id: categories[i].get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('subcategories', subcategories);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('subcategories');
    }
};
