/**
 * 20170224014248-add-account-id-to-notifications
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('notifications', 'account_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('notifications', 'account_id');
    }
};
