/**
 * 20171213224453-remove_description_from_videos_localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/12/14.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('videos_localized', 'description');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('videos_localized', 'description', {
            type: Sequelize.TEXT,
            allowNull: false
        });
    }
};
