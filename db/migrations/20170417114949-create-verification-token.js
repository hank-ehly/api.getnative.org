/**
 * 20170417114949-create-verification-tokens
 * get-native.com
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
            account_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'accounts',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
        }, {
            engine: 'InnoDB',
            charset: 'utf8'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('verification_tokens');
    }
};