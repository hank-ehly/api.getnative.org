/**
 * 20170227220658-cued_videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/28.
 */

const models  = require('../../app/models');
const User = models.User;
const Video   = models.Video;

const chance  = require('chance').Chance();
const _       = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min('id'), Video.max('id'), User.unscoped().min('id'), User.unscoped().max('id')];

        return Promise.all(promises).then(values => {
            const [minVideoId, maxVideoId, minUserId, maxUserId] = values;
            const cuedVideos = [];

            for (let i = minUserId; i <= maxUserId; i++) {
                let numCuedVideos = chance.integer({
                    min: 1,
                    max: 10
                });

                for (let j = 0; j < numCuedVideos; j++) {
                    cuedVideos.push({
                        video_id: chance.integer({
                            min: minVideoId,
                            max: maxVideoId
                        }),
                        user_id: i
                    });
                }
            }

            const uniqueCuedVideos = _.uniqWith(cuedVideos, _.isEqual);

            return queryInterface.bulkInsert('cued_videos', uniqueCuedVideos);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('cued_videos');
    }
};
