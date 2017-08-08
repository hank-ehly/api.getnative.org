/**
 * 20170226215117-followers
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/27.
 */

const chance  = require('chance').Chance();
const models  = require('../../app/models');
const Speaker = models.Speaker;
const User = models.User;

module.exports = {
    up: function(queryInterface, Sequelize) {
        return new Promise(r => r());
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('followers');
    }
};
