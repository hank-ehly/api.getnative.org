/**
 * 20170227213503-videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/28.
 */

const k           = require('../../config/keys.json');
const db          = require('../../app/models');
const Speaker     = db[k.Model.Speaker];
const Subcategory = db[k.Model.Subcategory];
const Language    = db[k.Model.Language];

const chance      = require('chance').Chance();
const moment      = require('moment');
const _           = require('lodash');

const videoUrls = [
    'http://techslides.com/demos/sample-videos/small.mp4',
    'http://www.sample-videos.com/video/mp4/480/big_buck_bunny_480p_2mb.mp4'
];

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [
            Speaker.min(k.Attr.Id),
            Speaker.max(k.Attr.Id),
            Subcategory.min(k.Attr.Id),
            Subcategory.max(k.Attr.Id),
            Language.findAll({attributes: [k.Attr.Id]})
        ];

        return Promise.all(promises).then(values => {
            const [minSpeakerId, maxSpeakerId, minSubcategoryId, maxSubcategoryId, languages] = values;
            const videos    = [];
            const numVideos = 50;
            const minDate   = moment().subtract(numVideos + 10, 'days');

            for (let i = 0; i < numVideos; i++) {
                let created_at   = moment(minDate).add(i + 1, 'days');
                let updated_at   = _.sample([
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
                    is_public: true,
                    picture_url: 'https://dummyimage.com/450x300.png/5fa2dd/ffffff',
                    loop_count: chance.integer({
                        min: 10,
                        max: 20000
                    }),
                    video_url: _.sample(videoUrls),
                    speaker_id: chance.integer({
                        min: minSpeakerId,
                        max: maxSpeakerId
                    }),
                    language_id: _.sample(languages).get(k.Attr.Id),
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
