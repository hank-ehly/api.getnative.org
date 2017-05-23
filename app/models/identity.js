/**
 * identity
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/22.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Identity, {}, {
        tableName: 'identities',
        underscored: true,
        associations: function(models) {
            models[k.Model.Identity].belongsTo(models[k.Model.AuthAdapterType]);
            models[k.Model.Identity].belongsTo(models[k.Model.User]);
        }
    });
};
