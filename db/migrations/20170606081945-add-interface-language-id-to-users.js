/**
 * 20170606081945-add-interface-language-id-to-users
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('users', 'interface_language_id', {
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
        return queryInterface.removeColumn('users', 'interface_language_id');
    }
};
