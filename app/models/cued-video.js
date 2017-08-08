/**
 * cued-video
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    const CuedVideo = sequelize.define(k.Model.CuedVideo, {}, {
        tableName: 'cued_videos',
        underscored: true,
        updatedAt: false,
        associations: function(models) {
            models[k.Model.CuedVideo].belongsTo(models[k.Model.User]);
            models[k.Model.CuedVideo].belongsTo(models[k.Model.Video]);
        }
    });

    CuedVideo.removeAttribute(k.Attr.Id);

    return CuedVideo;
};
