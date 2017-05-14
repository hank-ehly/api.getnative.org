/**
 * speaker
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Speaker, {
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        picture_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        is_silhouette_picture: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        tableName: 'speakers',
        underscored: true,
        associations: function(models) {
            models[k.Model.Speaker].belongsTo(models[k.Model.Gender]);
            models[k.Model.Speaker].belongsTo(models[k.Model.Language]);
            models[k.Model.Speaker].hasMany(models[k.Model.Follower], {as: 'followers'});
            models[k.Model.Speaker].hasMany(models[k.Model.Video], {as: 'videos'});
        }
    });
};
