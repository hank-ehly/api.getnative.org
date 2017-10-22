/**
 * 20170226055256-user-roles
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k       = require('../../config/keys.json');
const db      = require('../../app/models');
const User    = db[k.Model.User];
const Role    = db[k.Model.Role];

const _       = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([User.findAll({attributes: [k.Attr.Id, k.Attr.Email]}), Role.findAll({attributes: [k.Attr.Id, k.Attr.Name]})]).then(values => {
            const [users, roles] = values;
            const records = _.times(users.length, i => {
                let userEmail = users[i].get(k.Attr.Email);
                let user_id = users[i].get(k.Attr.Id);
                let role_id;

                if (userEmail === 'test@email.com') {
                    role_id = _.find(roles, {name: k.UserRole.User}).get(k.Attr.Id);
                } else if (userEmail === 'admin@email.com') {
                    role_id = _.find(roles, {name: k.UserRole.Admin}).get(k.Attr.Id);
                } else {
                    role_id = _.sample(roles).get(k.Attr.Id);
                }

                return {
                    user_id: user_id,
                    role_id: role_id
                };
            });

            return queryInterface.bulkInsert('user_roles', records);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('user_roles');
    }
};
