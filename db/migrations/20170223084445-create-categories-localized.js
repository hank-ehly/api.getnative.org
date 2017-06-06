/**
 * 20170223084445-create-categories-localized
 * get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('categories_localized', {
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
            },
            language_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'languages',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
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
        return queryInterface.dropTable('categories_localized');
    }
};
