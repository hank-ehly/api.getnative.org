/**
 * 20170510043539-create-roles
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/10.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('roles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8mb4'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('roles');
    }
};
