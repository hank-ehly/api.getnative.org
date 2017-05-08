/**
 * study-session
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('StudySession', {
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
            models.StudySession.belongsTo(models.Account);
            models.StudySession.belongsTo(models.Video);
            models.StudySession.hasOne(models.WritingAnswer);
        }
    });
};