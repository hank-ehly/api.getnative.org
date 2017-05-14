/**
 * 20170224020811-add-language-id-to-speakers
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('speakers', 'language_id', {
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
        return queryInterface.removeColumn('speakers', 'language_id');
    }
};
