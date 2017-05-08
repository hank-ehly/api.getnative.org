/**
 * 20170224020149-add-language-code-to-videos
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('videos', 'language_code', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('videos', 'language_code');
    }
};
