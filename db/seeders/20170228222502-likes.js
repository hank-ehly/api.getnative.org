/**
 * 20170228222502-likes
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const models  = require('../../app/models');
const chance  = require('chance').Chance();
const Promise = require('bluebird');
const Video   = models.Video;
const User = models.User;

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min('id'), Video.max('id'), User.min('id'), User.max('id')];

        return Promise.all(promises).spread((minVideoId, maxVideoId, minUserId, maxUserId) => {
            const likes = [];

            for (let i = minUserId; i <= maxUserId; i++) {
                let numVideoIds = chance.integer({
                    min: 5,
                    max: 20
                });

                let videoIds = chance.unique(chance.integer, numVideoIds, {
                    min: minVideoId,
                    max: maxVideoId
                });

                for (let j = 0; j < videoIds.length; j++) {
                    likes.push({
                        user_id: i,
                        video_id: videoIds[j]
                    });
                }
            }

            return queryInterface.bulkInsert('likes', likes);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('likes');
    }
};
