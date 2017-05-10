/**
 * 20170510044250-create-account-roles
 * get-native.com
 *
 * Created by henryehly on 2017/05/10.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('account_roles', {
            account_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'accounts',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'roles',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
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
            charset: 'utf8'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('account_roles');
    }
};
