/**
 * 20170226055256-user-roles
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k       = require('../../config/keys.json');
const db      = require('../../app/models');
const User    = db[k.Model.User];
const Role    = db[k.Model.Role];

const Promise = require('bluebird');
const _       = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.join(User.findAll({attributes: [k.Attr.Id]}), Role.findAll({attributes: [k.Attr.Id]}), (users, roles) => {
            const records = _.times(users.length, i => {
                return {
                    user_id: users[i].get(k.Attr.Id),
                    role_id: _.sample(roles).get(k.Attr.Id)
                }
            });

            return queryInterface.bulkInsert('user_roles', records);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('user_roles');
    }
};
