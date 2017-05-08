/**
 * 20170224013819-create-follower
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('followers', {
            speaker_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'speakers'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
            account_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'accounts'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            }
        }, {
            engine: 'InnoDB',
            charset: 'utf8'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('followers');
    }
};
