/**
 * user-role
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.UserRole, {}, {
        tableName: 'user_roles',
        underscored: true,
        associations: function(models) {
            models[k.Model.UserRole].belongsTo(models[k.Model.User]);
            models[k.Model.UserRole].belongsTo(models[k.Model.Role]);
        }
    });
};
