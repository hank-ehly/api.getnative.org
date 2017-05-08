/**
 * verification-token
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
    const VerificationToken = sequelize.define('VerificationToken', {
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
        expiration_date: {
            allowNull: false,
            type: DataTypes.DATE
        }
    }, {
        tableName: 'verification_tokens',
        timestamps: false,
        underscored: true,
        associations: function(models) {
            models.VerificationToken.belongsTo(models.Account);
        }
    });

    VerificationToken.prototype.isExpired = function() {
        return moment(this.expiration_date).isSameOrBefore(moment());
    };

    return VerificationToken;
};
