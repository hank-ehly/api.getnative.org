/**
 * 20170224002532-add-gender-id-to-speakers
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('speakers', 'gender_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'genders',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('speakers', 'gender_id');
    }
};
