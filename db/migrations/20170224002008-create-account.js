/**
 * 20170224002008-create-account
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('accounts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            browser_notifications_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 0
            },
            email_notifications_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 1
            },
            email_verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 0
            },
            picture_url: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            is_silhouette_picture: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 1
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW')
            },
            updated_at: {
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
        return queryInterface.dropTable('accounts');
    }
};
