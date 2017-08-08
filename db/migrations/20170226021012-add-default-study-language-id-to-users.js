/**
 * 20170226021012-add-default-study-language-id-to-users
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('users', 'default_study_language_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'languages',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('users', 'default_study_language_id');
    }
};
