/**
 * 20170226004707-add-language-id-to-transcripts
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('transcripts', 'language_code', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('transcripts', 'language_code');
    }
};
