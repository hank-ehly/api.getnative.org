/**
 * collocation
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Collocation', {
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
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
            models.Collocation.hasMany(models.UsageExample, {as: 'usage_examples'});
            models.Collocation.belongsTo(models.Transcript);
        }
    });
};