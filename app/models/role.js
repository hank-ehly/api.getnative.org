/**
 * role
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Role, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'roles',
        timestamps: false,
        underscored: true
    });
};
