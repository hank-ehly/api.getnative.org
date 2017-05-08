/**
 * transcript
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Transcript', {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        language_code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'transcripts',
        underscored: true,
        associations: function(models) {
            models.Transcript.belongsTo(models.Video);
            models.Transcript.hasMany(models.Collocation, {as: 'collocations'});
        }
    });
};