/**
 * 20170226215117-followers
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

const chance  = require('chance').Chance();
const models  = require('../../app/models');
const Speaker = models.Speaker;
const Account = models.Account;
const Promise = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return new Promise(r => r());
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('followers');
    }
};
