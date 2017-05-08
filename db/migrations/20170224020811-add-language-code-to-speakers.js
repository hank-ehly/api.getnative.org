/**
 * 20170224020811-add-language-id-to-speakers
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('speakers', 'language_code', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('speakers', 'language_code');
    }
};
