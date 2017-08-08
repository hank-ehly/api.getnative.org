/**
 * language
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const Language = sequelize.define(k.Model.Language, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'languages',
        underscored: true,
        associations: function(models) {
            models[k.Model.Language].hasMany(models[k.Model.Video], {as: 'videos'});
            models[k.Model.Language].hasMany(models[k.Model.Transcript], {as: 'transcripts'});
        }
    });

    Language.findIdForCode = async function(code) {
        if (!code) {
            throw new ReferenceError('argument code is undefined');
        }
        else if (!_.isString(code)) {
            throw new TypeError('argument code must be a string');
        }

        const record = await Language.find({
            where: {
                code: code
            },
            attributes: [
                k.Attr.Id
            ]
        });

        return record.get(k.Attr.Id);
    };

    return Language;
};
