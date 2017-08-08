/**
 * writing-question-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.WritingQuestionLocalized, {
        text: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        example_answer: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'writing_questions_localized',
        underscored: true,
        associations: function(models) {
            models[k.Model.WritingQuestionLocalized].belongsTo(models[k.Model.WritingQuestion], {as: 'writing_question'});
            models[k.Model.WritingQuestionLocalized].belongsTo(models[k.Model.Language], {as: 'language'});
        }
    });
};