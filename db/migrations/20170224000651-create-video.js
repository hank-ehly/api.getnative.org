/**
 * 20170224000651-create-video
 * get-native.com
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
            description: {
                type: Sequelize.TEXT,
                allowNull: false
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
        return queryInterface.dropTable('videos');
    }
};
