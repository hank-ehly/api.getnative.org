/**
 * 20170224015734-create-likes
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('likes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            video_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'videos',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'set null'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8mb4'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('likes');
    }
};
