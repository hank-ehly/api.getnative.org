/**
 * 20170418052433-verification-tokens
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/18.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');
const VerificationToken = db[k.Model.VerificationToken];
const User = db[k.Model.User];
const Auth = require('../../app/services')['Auth'];

const moment = require('moment');
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return User.findAll().then(users => {
            const verificationTokens = [];

            _(users).each(user => {
                let expirationDate = null;

                if (user.get([k.Attr.EmailVerified])) {
                    expirationDate = moment().subtract(_.random(1, 365, false), 'days').toDate();
                } else {
                    expirationDate = moment().add(1, 'days').toDate();
                }

                verificationTokens.push({
                    user_id: user.get(k.Attr.Id),
                    token: Auth.generateRandomHash(),
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
