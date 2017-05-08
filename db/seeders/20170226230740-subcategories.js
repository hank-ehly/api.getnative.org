/**
 * 20170226230740-subcategories
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

const Category = require('../../app/models').Category;
const chance   = require('chance').Chance();
const Promise  = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Category.min('id'), Category.max('id')]).spread((minCategoryId, maxCategoryId) => {
            const subcategories = [
                {name: 'libero non mattis'},
                {name: 'sapien a'},
                {name: 'mauris morbi non'},
                {name: 'nisi at'},
                {name: 'luctus et ultrices'},
                {name: 'faucibus cursus urna'},
                {name: 'nulla sed'},
                {name: 'consequat dui'},
                {name: 'vel ipsum praesent'},
                {name: 'morbi vestibulum velit'},
                {name: 'quis tortor'},
                {name: 'nulla suscipit ligula'},
                {name: 'in felis donec'},
                {name: 'justo sollicitudin ut'},
                {name: 'vel ipsum praesent blandit'},
                {name: 'quam suspendisse'},
                {name: 'justo lacinia'},
                {name: 'pellentesque eget'},
                {name: 'diam cras'},
                {name: 'luctus rutrum nulla tellus'},
                {name: 'ac leo'},
                {name: 'faucibus orci luctus'},
                {name: 'eu interdum'},
                {name: 'dapibus duis'},
                {name: 'quis lectus suspendisse potenti'},
                {name: 'tempor turpis'},
                {name: 'tellus in'},
                {name: 'nulla justo aliquam'},
                {name: 'luctus cum sociis natoque'},
                {name: 'potenti in'},
                {name: 'praesent lectus vestibulum'},
                {name: 'justo morbi'},
                {name: 'sed interdum venenatis'},
                {name: 'maecenas pulvinar'},
                {name: 'sed vel enim'},
                {name: 'justo sollicitudin ut'},
                {name: 'massa id lobortis'},
                {name: 'nulla ut'},
                {name: 'in felis'},
                {name: 'curabitur in libero u'}
            ];

            for (let i = 0; i < subcategories.length; i++) {
                subcategories[i].category_id = chance.integer({
                    min: minCategoryId,
                    max: maxCategoryId
                });
            }

            return queryInterface.bulkInsert('subcategories', subcategories);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('subcategories');
    }
};
