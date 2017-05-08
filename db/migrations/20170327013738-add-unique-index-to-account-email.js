/**
 * 20170327013738-add-unique-index-to-account-email
 * get-native.com
 *
 * Created by henryehly on 2017/03/27.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex('accounts', ['email'], {
            indicesType: 'UNIQUE'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex('accounts', ['email']);
    }
};
