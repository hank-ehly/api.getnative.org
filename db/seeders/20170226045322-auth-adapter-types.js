/**
 * 2017022604532-auth-adapter-types
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/14.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('auth_adapter_types', [
            {name: 'facebook'}, {name: 'twitter'}, {name: 'local'}, {name: 'google'}
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('auth_adapter_types', null, {});
    }
};
