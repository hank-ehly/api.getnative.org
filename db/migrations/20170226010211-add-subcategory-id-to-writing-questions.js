/**
 * 20170226010211-add-subcategory-id-to-writing-questions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('writing_questions', 'subcategory_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'subcategories',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('writing_questions', 'subcategory_id');
    }
};
