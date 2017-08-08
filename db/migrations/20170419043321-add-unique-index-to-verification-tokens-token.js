/**
 * 20170419043321-add-unique-index-to-verification-tokens-token
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/19.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex('verification_tokens', ['token'], {
            indicesType: 'UNIQUE'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex('verification_tokens', ['token']);
    }
};
