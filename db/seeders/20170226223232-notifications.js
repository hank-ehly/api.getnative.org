/**
 * 20170226223232-notifications
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/27.
 */

const User = require('../../app/models').User;
const chance  = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        return new Promise(r => r());
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('notifications');
    }
};
