/**
 * 20170723050810-email-update-requests
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return new Promise(r => r());
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('email_change_requests');
    }
};
