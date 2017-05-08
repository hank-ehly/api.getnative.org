/**
 * 20170226002926-add-collocation-id-to-usage-examples
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('usage_examples', 'collocation_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'collocations',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('usage_examples', 'collocation_id');
    }
};
