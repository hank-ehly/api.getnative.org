/**
 * 20170228224741-transcripts
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const models   = require('../../app/models');
const chance   = require('chance').Chance();
const Video    = models.Video;
const Language = models.Language;
const Promise  = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min('id'), Video.max('id'), Language.findAll({attributes: ['code']})];

        return Promise.all(promises).spread((minVideoId, maxVideoId, languages) => {
            const transcripts = [];

            for (let i = minVideoId; i <= maxVideoId; i++) {
                for (let j = 0; j < languages.length; j++) {
                    transcripts.push({
                        text: chance.paragraph() + chance.paragraph(),
                        video_id: i,
                        language_code: languages[j].code
                    });
                }
            }

            return queryInterface.bulkInsert('transcripts', transcripts);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('transcripts');
    }
};
