/**
 * 20170226223232-notifications
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

const Account = require('../../app/models').Account;
const chance  = require('chance').Chance();
const Promise = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Account.min('id'), Account.max('id')]).spread((minAccountId, maxAccountId) => {
            const notifications = [];

            for (let i = minAccountId; i <= maxAccountId; i++) {

                let numNotifications = chance.integer({
                    min: 1,
                    max: 10
                });

                for (let j = 0; j < numNotifications; j++) {
                    notifications.push({
                        account_id: chance.integer({
                            min: minAccountId,
                            max: maxAccountId
                        }),
                        title: chance.sentence({
                            words: chance.integer({
                                min: 2,
                                max: 5
                            })
                        }),
                        content: chance.paragraph()
                    });
                }
            }

            return queryInterface.bulkInsert('notifications', notifications);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('notifications');
    }
};
