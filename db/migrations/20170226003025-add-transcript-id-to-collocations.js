/**
 * 20170226003025-add-transcript-id-to-collocation-occurrences
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('collocation_occurrences', 'transcript_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'transcripts',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('collocation_occurrences', 'transcript_id');
    }
};
