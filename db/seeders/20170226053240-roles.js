/**
 * 20170226053240-roles
 * api.get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('roles', [
            {
                description: chance.paragraph(),
                name: 'admin'
            }, {
                description: chance.paragraph(),
                name: 'user'
            }
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('roles');
    }
};
