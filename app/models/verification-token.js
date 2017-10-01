/**
 * verification-token
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const moment = require('moment');
const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    const VerificationToken = sequelize.define(k.Model.VerificationToken, {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        is_verification_complete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        expiration_date: {
            allowNull: false,
            type: DataTypes.DATE
        }
    }, {
        tableName: 'verification_tokens',
        timestamps: false,
        underscored: true,
        associations: function(db) {
            db[k.Model.VerificationToken].belongsTo(db[k.Model.User]);
            db[k.Model.VerificationToken].hasMany(db[k.Model.EmailChangeRequest], {as: 'email_change_requests'});
        }
    });

    VerificationToken.prototype.isExpired = function() {
        return moment(this.expiration_date).isSameOrBefore(moment());
    };

    return VerificationToken;
};
