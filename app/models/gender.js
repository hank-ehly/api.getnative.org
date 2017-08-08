/**
 * gender
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Gender, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'genders',
        timestamps: false,
        underscored: true,
        associations: function(models) {
            models[k.Model.Gender].hasMany(models[k.Model.Speaker]);
        }
    });
};
