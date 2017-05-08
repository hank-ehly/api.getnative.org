/**
 * speaker
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Speaker', {
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        gender: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        language_code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
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
            models.Speaker.hasMany(models.Follower, {as: 'followers'});
            models.Speaker.hasMany(models.Video, {as: 'videos'});
        }
    });
};
