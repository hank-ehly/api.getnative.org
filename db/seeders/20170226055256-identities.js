/**
 * 20170226055255-identities
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/23.
 */

const chance          = require('chance').Chance();
const Auth            = require('../../app/services')['Auth'];
const k               = require('../../config/keys.json');
const db              = require('../../app/models');
const User            = db[k.Model.User];
const AuthAdapterType = db[k.Model.AuthAdapterType];

const _               = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return AuthAdapterType.findOne({
            where: {
                name: 'local'
            },
            attributes: [
                k.Attr.Id
            ]
        }).then(authAdapterType => {
            return Promise.all([
                authAdapterType, User.findAll({
                    attributes: [
                        k.Attr.Id
                    ]
                })
            ]);
        }).then(values => {
            const [authAdapterType, users] = values;
            const identities = _.times(users.length, i => {
                return {
                    user_id: users[i].get(k.Attr.Id),
                    auth_adapter_type_id: authAdapterType.get(k.Attr.Id)
                }
            });

            return queryInterface.bulkInsert('identities', identities);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('identities');
    }
};
