/**
 * 20170224002017-add-auth-adapter-type-id-to-identities
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('identities', 'auth_adapter_type_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'auth_adapter_types',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('identities', 'auth_adapter_type_id');
    }
};
