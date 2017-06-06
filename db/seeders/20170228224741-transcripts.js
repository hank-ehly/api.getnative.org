/**
 * 20170228224741-transcripts
 * api.get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k        = require('../../config/keys.json');
const db       = require('../../app/models');
const Language = db[k.Model.Language];
const Video    = db[k.Model.Video];

const Promise  = require('bluebird');
const chance   = require('chance').Chance();
const _        = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min(k.Attr.Id), Video.max(k.Attr.Id), Language.findAll({attributes: [k.Attr.Id]})];

        return Promise.all(promises).spread((minVideoId, maxVideoId, languages) => {
            const transcripts = [];

            for (let i = minVideoId; i <= maxVideoId; i++) {
                for (let j = 0; j < languages.length; j++) {
                    transcripts.push({
                        text: chance.paragraph() + chance.paragraph(),
                        video_id: i,
                        language_id: _.sample(languages).get(k.Attr.Id),
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
