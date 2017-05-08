/**
 * 20170224014712-create-cued-video
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('cued_videos', {
            video_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'videos',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
            },
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
        return queryInterface.dropTable('cued_videos');
    }
};
