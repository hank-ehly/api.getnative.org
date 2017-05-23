/**
 * credential
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Credential, {
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'credentials',
        underscored: true,
        associations: function(models) {
            models[k.Model.Credential].belongsTo(models[k.Model.User]);
        }
    });
};
