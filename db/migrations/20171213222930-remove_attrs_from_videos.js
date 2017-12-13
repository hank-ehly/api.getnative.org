/**
 * 20171213222930-remove_attrs_from_videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/14.
 */

const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = _.map(['video_url', 'picture_url', 'loop_count', 'length'], col => queryInterface.removeColumn('videos', col));
        return Promise.all(promises);
    },

    down: function(queryInterface, Sequelize) {
        const addVideoURL = queryInterface.addColumn('videos', 'video_url', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });

        const addPictureURL = queryInterface.addColumn('videos', 'picture_url', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        });

        const addLoopCount = queryInterface.addColumn('videos', 'loop_count', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });

        const addLength = queryInterface.addColumn('videos', 'length', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });

        return Promise.all([addVideoURL, addPictureURL, addLoopCount, addLength]);
    }
};
