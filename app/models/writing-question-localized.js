/**
 * writing-question-localized
 * get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    const WritingQuestionLocalized = sequelize.define(k.Model.WritingQuestionLocalized, {
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

    WritingQuestionLocalized.removeAttribute(k.Attr.Id);

    return WritingQuestionLocalized;
};