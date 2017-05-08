/**
 * 20170301025901-study-sessions
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const chance  = require('chance').Chance();
const models  = require('../../app/models');
const Promise = require('bluebird');
const Account = models.Account;
const Video   = models.Video;

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Account.min('id'), Account.max('id'), Video.min('id'), Video.max('id')];

        return Promise.all(promises).spread((minAccountId, maxAccountId, minVideoId, maxVideoId) => {
            const studySessions = [];
            const possibleStudyTimes = [];

            for (let i = 300; i <= 1200; i += 60) {
                possibleStudyTimes.push(i);
            }

            const minDate = new Date(2016, 0, 0).valueOf();
            const maxDate = new Date().valueOf();

            for (let i = minAccountId; i <= maxAccountId; i++) {
                let numStudySessions = chance.integer({
                    min: 5,
                    max: 365
                });

                for (let j = 0; j < numStudySessions; j++) {
                    studySessions.push({
                        video_id: chance.integer({
                            min: minVideoId,
                            max: maxVideoId
                        }),
                        account_id: i,
                        study_time: chance.pickone(possibleStudyTimes),
                        created_at: new Date(chance.integer({min: minDate, max: maxDate})),
                        is_completed: chance.bool()
                    });
                }
            }

            return queryInterface.bulkInsert('study_sessions', studySessions);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('study_sessions');
    }
};
