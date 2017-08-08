/**
 * 20170226224540-categories
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/27.
 */

const moment = require('moment');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const numberOfCategories = 8, categories = [];

        for (let i = 0; i < numberOfCategories; i++) {
            categories.push({
                created_at: moment().toDate()
            });
        }

        return queryInterface.bulkInsert('categories', categories);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('categories');
    }
};
