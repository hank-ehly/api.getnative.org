/**
 * writing-question
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.WritingQuestion, {}, {
        tableName: 'writing_questions',
        underscored: true,
        associations: function(models) {
            models[k.Model.WritingQuestion].belongsTo(models[k.Model.Subcategory]);
            models[k.Model.WritingQuestion].hasMany(models[k.Model.WritingAnswer], {as: 'writing_answers'});
            models[k.Model.WritingQuestion].hasMany(models[k.Model.WritingQuestionLocalized], {as: 'writing_questions_localized'});
        }
    });
};