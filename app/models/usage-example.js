/**
 * usage-example
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('UsageExample', {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'usage_examples',
        underscored: true,
        associations: function(models) {
            models.UsageExample.belongsTo(models.Collocation);
        }
    });
};