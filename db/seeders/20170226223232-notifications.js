/**
 * 20170226223232-notifications
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

const Account = require('../../app/models').Account;
const chance  = require('chance').Chance();
const Promise = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return new Promise(r => r());
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('notifications');
    }
};
