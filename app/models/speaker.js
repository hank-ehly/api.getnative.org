/**
 * speaker
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Speaker, {
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
            models[k.Model.Speaker].belongsTo(models[k.Model.Gender], {as: 'gender'});
            models[k.Model.Speaker].hasMany(models[k.Model.Follower], {as: 'followers'});
            models[k.Model.Speaker].hasMany(models[k.Model.Video], {as: 'videos'});
            models[k.Model.Speaker].hasMany(models[k.Model.SpeakerLocalized], {as: 'speakers_localized'});
        }
    });
};
