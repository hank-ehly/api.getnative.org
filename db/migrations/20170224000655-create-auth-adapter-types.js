/**
 * 20170224000655-create-auth-adapter-types
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('auth_adapter_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
            },
            updated_at: {
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
        return queryInterface.dropTable('auth_adapter_types');
    }
};
