/**
 * 20170226003025-add-transcript-id-to-collocations
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('collocations', 'transcript_id', {
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
        return queryInterface.removeColumn('collocations', 'transcript_id');
    }
};
