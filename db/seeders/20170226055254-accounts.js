/**
 * 20170226055254-accounts
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const chance     = require('chance').Chance();
const AuthHelper = require('../../app/services').Auth;
const k          = require('../../config/keys.json');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const accounts = [];

        let numAccounts = 500;

        if ([k.Env.Test, k.Env.CircleCI].includes(process.env.NODE_ENV)) {
            numAccounts = 5;

            accounts.push({
                email: 'test@email.com',
                password: AuthHelper.hashPassword('test_password'),
                browser_notifications_enabled: false,
                email_notifications_enabled: false,
                email_verified: false,
                default_study_language_code: 'en',
                picture_url: 'https://dummyimage.com/100x100.png/5fa2dd/ffffff',
                is_silhouette_picture: false
            });
        }

        for (let i = 0; i < numAccounts; i++) {
            accounts.push({
                email: chance.email(),
                password: AuthHelper.hashPassword('password'),
                browser_notifications_enabled: chance.bool(),
                email_notifications_enabled: chance.bool(),
                email_verified: chance.bool({likelihood: 80}),
                default_study_language_code: chance.pickone(['en', 'ja']),
                picture_url: 'https://dummyimage.com/100x100.png/5fa2dd/ffffff',
                is_silhouette_picture: chance.bool()
            });
        }

        return queryInterface.bulkInsert('accounts', accounts);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('accounts');
    }
};
