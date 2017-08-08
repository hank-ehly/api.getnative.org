/**
 * auth-adapter-type
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const AuthAdapterType = sequelize.define(k.Model.AuthAdapterType, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'auth_adapter_types',
        underscored: true
    });

    AuthAdapterType.findIdForProvider = async function(provider) {
        if (!provider) {
            throw new ReferenceError('argument provider is undefined');
        }
        else if (!_.isString(provider)) {
            throw new TypeError('argument provider must be a string');
        }

        const record = await AuthAdapterType.find({
            where: {
                name: provider
            },
            attributes: [
                k.Attr.Id
            ]
        });

        return record.get(k.Attr.Id);
    };

    return AuthAdapterType;
};
