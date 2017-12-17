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

const youTubeVideoIds = [
    'ri6Pip_w6HM',
    '60gku_E_rAc',
    'mugGiwFG9XY',
    'ibDTuAPefms',
    'NvEafA3cUqc'
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
                    is_public: true,
                    youtube_video_id: _.sample(youTubeVideoIds),
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
