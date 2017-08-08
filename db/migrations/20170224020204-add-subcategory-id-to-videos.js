/**
 * 20170224020204-add-subcategory-id-to-videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('videos', 'subcategory_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'subcategories',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('videos', 'subcategory_id');
    }
};
