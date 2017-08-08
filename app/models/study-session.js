/**
 * study-session
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.StudySession, {
        study_time: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'study_sessions',
        underscored: true,
        updatedAt: false,
        associations: function(models) {
            models[k.Model.StudySession].belongsTo(models[k.Model.User], {as: 'user'});
            models[k.Model.StudySession].belongsTo(models[k.Model.Video], {as: 'video'});
            models[k.Model.StudySession].hasMany(models[k.Model.WritingAnswer], {as: 'writing_answers'});
        }
    });
};