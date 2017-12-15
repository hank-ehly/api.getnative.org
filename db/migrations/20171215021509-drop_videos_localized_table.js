/**
 * 20171215021509-drop_videos_localized_table
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/15.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('videos_localized');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.createTable('videos_localized', {
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
            language_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'languages',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
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
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8mb4'
        });
    }
};
