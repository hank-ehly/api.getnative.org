/**
 * language
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Language, {
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
        underscored: true,
        associations: function(models) {
            models[k.Model.Language].hasMany(models[k.Model.Video], {as: 'videos'});
            models[k.Model.Language].hasMany(models[k.Model.Transcript], {as: 'transcripts'});
        }
    });
};
