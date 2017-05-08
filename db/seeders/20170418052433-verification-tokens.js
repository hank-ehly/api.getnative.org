/**
 * 20170418052433-verification-tokens
 * get-native.com
 *
 * Created by henryehly on 2017/04/18.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');
const VerificationToken = db[k.Model.VerificationToken];
const Account = db[k.Model.Account];
const Auth = require('../../app/services')['Auth'];

const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Account.findAll().then(accounts => {
            const verificationTokens = [];

            _(accounts).each(account => {
                let expirationDate = null;

                if (account.get([k.Attr.EmailVerified])) {
                    expirationDate = moment().subtract(_.random(1, 365, false), 'days').toDate();
                } else {
                    expirationDate = moment().add(1, 'days').toDate();
                }

                verificationTokens.push({
                    account_id: account.get(k.Attr.Id),
                    token: Auth.generateVerificationToken(),
                    expiration_date: expirationDate
                });
            });

            return queryInterface.bulkInsert('verification_tokens', verificationTokens);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('verification_tokens');
    }
};
