/**
 * 20170228222502-likes
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const Video = db[k.Model.Video];
const User = db[k.Model.User];

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min(k.Attr.Id), Video.max(k.Attr.Id), User.unscoped().min(k.Attr.Id), User.unscoped().max(k.Attr.Id)];

        return Promise.all(promises).then(values => {
            const [minVideoId, maxVideoId, minUserId, maxUserId] = values;
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
