/**
 * auth-adapter-type
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.AuthAdapterType, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'auth_adapter_types',
        underscored: true
    });
};
