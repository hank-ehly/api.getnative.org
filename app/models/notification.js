/**
 * notification
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Notification', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'notifications',
        underscored: true,
        associations: function(models) {
            models.Notification.belongsTo(models.Account);
        }
    });
};