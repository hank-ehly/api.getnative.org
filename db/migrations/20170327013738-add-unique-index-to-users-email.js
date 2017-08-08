/**
 * 20170327013738-add-unique-index-to-users-email
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/27.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex('users', ['email'], {
            indicesType: 'UNIQUE'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex('users', ['email']);
    }
};
