/**
 * 20170226004422-add-video-id-to-transcripts
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('transcripts', 'video_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'videos',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('transcripts', 'video_id');
    }
};
