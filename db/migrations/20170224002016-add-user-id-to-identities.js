/**
 * 20170224002016-add-user-id-to-identities
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('identities', 'user_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('identities', 'user_id');
    }
};
