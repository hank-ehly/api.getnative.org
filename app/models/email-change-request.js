/**
 * email-change-request
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(k.Model.EmailChangeRequest, {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'email_change_requests',
        timestamps: false,
        underscored: true,
        associations: function(db) {
            db[k.Model.EmailChangeRequest].belongsTo(db[k.Model.VerificationToken], {as: 'verification_token'});
        }
    });
};
