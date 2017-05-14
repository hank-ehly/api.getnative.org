/**
 * 20170327013738-add-unique-index-to-credentials-email
 * get-native.com
 *
 * Created by henryehly on 2017/03/27.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex('credentials', ['email'], {
            indicesType: 'UNIQUE'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex('credentials', ['email']);
    }
};
