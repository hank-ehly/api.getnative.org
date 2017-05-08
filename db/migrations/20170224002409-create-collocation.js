/**
 * 20170224002409-create-collocation
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('collocations', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            text: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            ipa_spelling: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
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
        return queryInterface.dropTable('collocations');
    }
};
