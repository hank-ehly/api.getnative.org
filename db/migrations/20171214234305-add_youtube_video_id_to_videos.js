/**
 * 20171214234305-add_youtube_video_id_to_videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/15.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('videos', 'youtube_video_id', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('videos', 'youtube_video_id');
    }
};
