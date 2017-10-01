/**
 * 20170417114949-create-verification-tokens
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/17.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('verification_tokens', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            token: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            expiration_date: {
                allowNull: false,
                type: Sequelize.DATE
            },
            is_verification_complete: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: 0
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
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
        return queryInterface.dropTable('verification_tokens');
    }
};