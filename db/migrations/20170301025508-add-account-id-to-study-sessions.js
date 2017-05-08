/**
 * 20170301025508-add-account-id-to-study-sessions
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('study_sessions', 'account_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('study_sessions', 'account_id');
    }
};
