/**
 * language
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

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
        underscored: true,
        associations: function(models) {
            // this association is unused, but is in place for data integrity
            // models[k.Model.Language].hasMany(models[k.Model.User], {as: 'users'})

            models[k.Model.Language].hasMany(models[k.Model.Video], {as: 'videos'});
            models[k.Model.Language].hasMany(models[k.Model.Transcript], {as: 'transcripts'});
        }
    });
};
