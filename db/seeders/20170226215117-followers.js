/**
 * 20170226215117-followers
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

const chance  = require('chance').Chance();
const models  = require('../../app/models');
const Speaker = models.Speaker;
const Account = models.Account;
const Promise = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Account.min('id'), Account.max('id'), Speaker.min('id'), Speaker.max('id')];

        return Promise.all(promises).spread((minAccountId, maxAccountId, minSpeakerId, maxSpeakerId) => {
            let followers = [];

            for (let i = minAccountId; i <= maxAccountId; i++) {
                let numFollowers = chance.integer({
                    min: 1,
                    max: 5
                });

                for (let j = 0; j < numFollowers; j++) {
                    followers.push({
                        speaker_id: chance.integer({
                            min: minSpeakerId,
                            max: maxSpeakerId
                        })
                    });
                }
            }

            for (let i = 0; i < followers.length; i++) {
                followers[i].account_id = chance.integer({
                    min: minAccountId,
                    max: maxAccountId
                });
            }

            return queryInterface.bulkInsert('followers', followers);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('followers');
    }
};
