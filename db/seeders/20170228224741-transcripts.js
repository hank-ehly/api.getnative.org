/**
 * 20170228224741-transcripts
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const Language = db[k.Model.Language];
const Video = db[k.Model.Video];
const jaCorpus = require('../fixtures/ja-corpus.json');

const chance = require('chance').Chance();
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [Video.min(k.Attr.Id), Video.max(k.Attr.Id), Language.findAll({attributes: [k.Attr.Id, k.Attr.Code]})];

        return Promise.all(promises).then(values => {
            const [minVideoId, maxVideoId, languages] = values;
            const transcripts = [];

            for (let i = minVideoId; i <= maxVideoId; i++) {
                for (let j = 0; j < languages.length; j++) {
                    const text = languages[j].get(k.Attr.Code) === 'ja' ? chance.pickset(jaCorpus, 3).join('') : chance.paragraph({
                        sentences: chance.natural({
                            min: 6,
                            max: 10
                        })
                    });

                    transcripts.push({
                        text: text,
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
