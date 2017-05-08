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
const Account = models.Account;

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min('id'), Video.max('id'), Account.min('id'), Account.max('id')];

        return Promise.all(promises).spread((minVideoId, maxVideoId, minAccountId, maxAccountId) => {
            const likes = [];

            for (let i = minAccountId; i <= maxAccountId; i++) {
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
                        account_id: i,
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
