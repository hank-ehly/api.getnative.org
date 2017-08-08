/**
 * 20170224020149-add-language-id-to-videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('videos', 'language_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'languages',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('videos', 'language_id');
    }
};
