/**
 * 20170226055254-credentials
 * get-native.com
 *
 * Created by henryehly on 2017/05/14.
 */

const chance = require('chance').Chance();
const Auth   = require('../../app/services')['Auth'];
const k      = require('../../config/keys.json');
const User   = require('../../app/models')[k.Model.User];

const _      = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return User.findAll().then(users => {
            const credentials = _.times(users.length, i => {
                return {
                    email: chance.email(),
                    password: Auth.hashPassword('password'),
                    user_id: users[i].get(k.Attr.Id)
                }
            });

            _.first(credentials).email = 'test@email.com';

            return queryInterface.bulkInsert('credentials', credentials);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('credentials');
    }
};
