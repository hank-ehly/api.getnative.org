/**
 * cued-video
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    const CuedVideo = sequelize.define('CuedVideo', {}, {
        tableName: 'cued_videos',
        underscored: true,
        updatedAt: false,
        associations: function(models) {
            models.CuedVideo.belongsTo(models.Account);
            models.CuedVideo.belongsTo(models.Video);
        }
    });

    CuedVideo.removeAttribute('id');

    return CuedVideo;
};
