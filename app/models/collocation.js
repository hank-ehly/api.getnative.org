/**
 * collocation
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Collocation', {
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
        tableName: 'collocations',
        underscored: true,
        associations: function(models) {
            models[k.Model.Collocation].hasMany(models[k.Model.UsageExample], {as: 'usage_examples'});
            models[k.Model.Collocation].belongsTo(models[k.Model.Transcript]);
        }
    });
};