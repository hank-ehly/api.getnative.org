/**
 * writing-question
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('WritingQuestion', {
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
        tableName: 'writing_questions',
        underscored: true,
        associations: function(models) {
            models[k.Model.WritingQuestion].belongsTo(models[k.Model.Subcategory]);
            models[k.Model.WritingQuestion].hasMany(models[k.Model.WritingAnswer], {as: 'writing_answers'});
        }
    });
};