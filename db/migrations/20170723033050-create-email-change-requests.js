/**
 * 20170723033050-create-email-change-requests
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('email_change_requests', {
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
            verification_token_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'verification_tokens',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
        }, {
            engine: 'InnoDB',
            charset: 'utf8mb4'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('email_change_requests');
    }
};
