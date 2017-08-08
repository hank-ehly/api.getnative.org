/**
 * like
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.Like, {}, {
        tableName: 'likes',
        underscored: true,
        paranoid: true,
        updatedAt: false,
        associations: function(db) {
            db[k.Model.Like].belongsTo(db[k.Model.User]);
            db[k.Model.Like].belongsTo(db[k.Model.Video]);
        }
    });
};