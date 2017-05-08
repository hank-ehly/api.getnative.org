/**
 * 20170226021012-add-default-study-language-code-to-accounts
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('accounts', 'default_study_language_code', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'en'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('accounts', 'default_study_language_code');
    }
};
