/**
 * 20170226002926-add-collocation-occurrence-id-to-usage-examples
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('usage_examples', 'collocation_occurrence_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'collocation_occurrences',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('usage_examples', 'collocation_occurrence_id');
    }
};
