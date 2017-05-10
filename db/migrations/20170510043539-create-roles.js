/**
 * 20170510043539-create-roles
 * get-native.com
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
            type: {
                type: Sequelize.ENUM('admin', 'user'), // later include 'contributor'
                allowNull: false,
                defaultValue: 'user'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('roles');
    }
};
