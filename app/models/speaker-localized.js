/**
 * speaker-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.SpeakerLocalized, {
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
        }
    }, {
        tableName: 'speakers_localized',
        underscored: true,
        associations: function(models) {
            models[k.Model.SpeakerLocalized].belongsTo(models[k.Model.Speaker], {as: 'speaker'});
            models[k.Model.SpeakerLocalized].belongsTo(models[k.Model.Language], {as: 'language'});
        }
    });
};
