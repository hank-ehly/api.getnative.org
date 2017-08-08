/**
 * 20170301025508-add-user-id-to-study-sessions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('study_sessions', 'user_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('study_sessions', 'user_id');
    }
};
