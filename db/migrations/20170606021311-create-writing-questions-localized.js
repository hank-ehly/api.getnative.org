/**
 * 20170606021311-create-writing-questions-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('writing_questions_localized', {
            writing_question_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'writing_questions',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
            },
            language_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'languages',
                    key: 'id'
                },
                onUpdate: 'restrict',
                onDelete: 'restrict',
                primaryKey: true
            },
            text: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ''
            },
            example_answer: {
                type: Sequelize.TEXT,
                allowNull: false
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
        return queryInterface.dropTable('writing_questions_localized');
    }
};