/**
 * 20170606021525-create-speakers-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('speakers_localized', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            language_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'languages',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
            speaker_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'speakers',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            location: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            name: {
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
            charset: 'utf8mb4'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('speakers_localized');
    }
};
