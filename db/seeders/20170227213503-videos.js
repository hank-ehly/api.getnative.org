/**
 * 20170227213503-videos
 * get-native.com
 *
 * Created by henryehly on 2017/02/28.
 */

const models      = require('../../app/models');
const Speaker     = models.Speaker;
const Subcategory = models.Subcategory;
const chance      = require('chance').Chance();
const Promise     = require('bluebird');
const moment      = require('moment');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Speaker.min('id'), Speaker.max('id'), Subcategory.min('id'), Subcategory.max('id')];

        return Promise.all(promises).spread((minSpeakerId, maxSpeakerId, minSubcategoryId, maxSubcategoryId) => {
            const videos          = [];
            const numVideos       = 500;
            const youtubeVideoIds = ['9Ayf8Iny9Eg', 'GXsZMQshNzg', 'yCe0DtGq8Pc', '7TQfjmEpYig', 'C9BYTZkde4w'];

            const minDate         = moment().subtract(numVideos + 10, 'days');

            for (let i = 0; i < numVideos; i++) {
                let created_at   = moment(minDate).add(i + 1, 'days');
                let updated_at   = chance.pickone([
                    moment(created_at),
                    moment(created_at).add(1, 'days'),
                    moment(created_at).add(2, 'days'),
                    moment(created_at).add(3, 'days'),
                    moment(created_at).add(4, 'days'),
                    moment(created_at).add(5, 'days')
                ]);

                videos.push({
                    length: chance.integer({
                        min: 30,
                        max: 150
                    }),
                    picture_url: 'https://dummyimage.com/450x300.png/5fa2dd/ffffff',
                    loop_count: chance.integer({
                        min: 10,
                        max: 20000
                    }),
                    video_url: 'https://youtu.be/' + chance.pickone(youtubeVideoIds),
                    description: chance.paragraph(),
                    speaker_id: chance.integer({
                        min: minSpeakerId,
                        max: maxSpeakerId
                    }),
                    language_code: chance.pickone(['en', 'ja']),
                    subcategory_id: chance.integer({
                        min: minSubcategoryId,
                        max: maxSubcategoryId
                    }),
                    created_at: created_at.toDate(),
                    updated_at: updated_at.toDate()
                });
            }

            return queryInterface.bulkInsert('videos', videos);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('videos');
    }
};
