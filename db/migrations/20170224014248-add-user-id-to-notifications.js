/**
 * 20170224014248-add-user-id-to-notifications
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('notifications', 'user_id', {
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
        return queryInterface.removeColumn('notifications', 'user_id');
    }
};
