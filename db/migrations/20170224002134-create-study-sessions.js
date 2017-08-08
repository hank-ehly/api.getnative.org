/**
 * 20170224002134-create-study-sessions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('study_sessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            study_time: {
                allowNull: false,
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            },
            is_completed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 0
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8mb4'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('study_sessions');
    }
};
