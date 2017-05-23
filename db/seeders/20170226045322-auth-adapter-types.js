/**
 * 2017022604532-auth-adapter-types
 * get-native.com
 *
 * Created by henryehly on 2017/05/14.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('auth_adapter_types', [
            {name: 'facebook'}, {name: 'twitter'}, {name: 'local'}
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('auth_adapter_types', null, {});
    }
};
