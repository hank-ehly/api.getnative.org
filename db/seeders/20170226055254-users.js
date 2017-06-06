/**
 * 20170226055254-users
 * api.get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const chance   = require('chance').Chance();
const Auth     = require('../../app/services')['Auth'];
const k        = require('../../config/keys.json');
const Language = require('../../app/models')[k.Model.Language];

const _        = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const count = [k.Env.Test, k.Env.CircleCI].includes(process.env.NODE_ENV) ? 5 : 500;

        return Language.findAll({attributes: [k.Attr.Id]}).then(languages => {
            const records = _.times(count, () => {
                return {
                    browser_notifications_enabled: chance.bool(),
                    default_study_language_id: _.sample(languages).get(k.Attr.Id),
                    interface_language_id: _.sample(languages).get(k.Attr.Id),
                    email: chance.email(),
                    email_notifications_enabled: chance.bool(),
                    email_verified: chance.bool({likelihood: 80}),
                    is_silhouette_picture: chance.bool(),
                    name: chance.name(),
                    picture_url: 'https://dummyimage.com/100x100.png/5fa2dd/ffffff'
                }
            });

            /* For testing purposes */
            _.nth(records, 0)[k.Attr.Email] = 'test@email.com';
            _.nth(records, 1)[k.Attr.Email] = 'admin@email.com';

            return queryInterface.bulkInsert('users', records);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('users');
    }
};
