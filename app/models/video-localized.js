/**
 * video-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/10.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.VideoLocalized, {
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'videos_localized',
        paranoid: true,
        underscored: true,
        associations: function(models) {
            models[k.Model.VideoLocalized].belongsTo(models[k.Model.Video], {as: 'video'});
            models[k.Model.VideoLocalized].belongsTo(models[k.Model.Language], {as: 'language'});
        }
    });
};

