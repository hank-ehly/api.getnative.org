/**
 * 20170226002733-add-study-session-id-to-writing-answers
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('writing_answers', 'study_session_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'study_sessions',
                key: 'id'
            },
            onUpdate: 'restrict',
            onDelete: 'restrict'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('writing_answers', 'study_session_id');
    }
};
