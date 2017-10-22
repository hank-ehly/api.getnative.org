/**
 * 20170226053240-roles
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

const chance = require('chance').Chance();
const k = require('../../config/keys.json');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('roles', [
            {
                description: 'The role for admin users. Allows login to admin screen.',
                name: k.UserRole.Admin
            }, {
                description: 'The default role for normal users.',
                name: k.UserRole.User
            }
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('roles');
    }
};
