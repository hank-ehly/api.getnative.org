/**
 * 20170224000651-create-videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('videos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            length: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            is_public: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 0
            },
            picture_url: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            loop_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            video_url: {
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
        return queryInterface.dropTable('videos');
    }
};
