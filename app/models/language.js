/**
 * language
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Language', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'languages',
        underscored: true
    });
};
