/**
 * 20170301025901-study-sessions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const User = db[k.Model.User];
const Video = db[k.Model.Video];

const chance = require('chance').Chance();
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [User.unscoped().min('id'), User.unscoped().max('id'), Video.min('id'), Video.max('id')];

        return Promise.all(promises).then(values => {
            const [minUserId, maxUserId, minVideoId, maxVideoId] = values;
            const studySessions = [];
            const possibleStudyTimes = [];

            for (let i = 300; i <= 1200; i += 60) {
                possibleStudyTimes.push(i);
            }

            const minDate = new Date(2016, 0, 0).valueOf();
            const maxDate = new Date().valueOf();

            for (let i = minUserId; i <= maxUserId; i++) {
                let numStudySessions = chance.integer({
                    min: 5,
                    max: _.includes([k.Env.Test, k.Env.CircleCI], process.env['NODE_ENV']) ? 10 : 50
                });

                for (let j = 0; j < numStudySessions; j++) {
                    studySessions.push({
                        video_id: chance.integer({
                            min: minVideoId,
                            max: maxVideoId
                        }),
                        user_id: i,
                        study_time: chance.pickone(possibleStudyTimes),
                        created_at: new Date(chance.integer({
                            min: minDate,
                            max: maxDate
                        })),
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
