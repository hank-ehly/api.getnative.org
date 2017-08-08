/**
 * collocation-occurrence
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.CollocationOccurrence, {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        ipa_spelling: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'collocation_occurrences',
        paranoid: true,
        underscored: true,
        associations: function(models) {
            models[k.Model.CollocationOccurrence].hasMany(models[k.Model.UsageExample], {as: 'usage_examples'});
            models[k.Model.CollocationOccurrence].belongsTo(models[k.Model.Transcript]);
        }
    });
};