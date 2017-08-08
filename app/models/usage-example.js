/**
 * usage-example
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.UsageExample, {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'usage_examples',
        underscored: true,
        associations: function(models) {
            models[k.Model.UsageExample].belongsTo(models[k.Model.CollocationOccurrence]);
        }
    });
};