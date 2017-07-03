/**
 * 20170301091520-collocation-occurrences
 * api.get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const Transcript = require('../../app/models')[k.Model.Transcript];

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Transcript.min(k.Attr.Id), Transcript.max(k.Attr.Id)]).then(values => {
            const [minTranscriptId, maxTranscriptId] = values;
            const occurrences = [];
            const ipa_pool = 'ɑæɐɑ̃βɓʙɕçðd͡ʒɖɗəɚɵɘɛɜɝɛ̃ɞɠʛɢɥɦɧħʜɪɪ̈ɨʝɟʄɫʟɬɭɮɱŋɲɴɳɔœøɒɔ̃ɶɸɐɾʁɹɻʀɽɺʃʂθt͡ʃt͡sʈʊʊ̈ʉʌʋⱱʍɯɰχʎʏʏɤɣʒʐʑʔʕʢʡ';

            for (let i = minTranscriptId; i <= maxTranscriptId; i++) {
                let numOccurrences = chance.integer({
                    min: 5,
                    max: 10
                });

                for (let j = 0; j < numOccurrences; j++) {
                    occurrences.push({
                        text: chance.sentence({
                            words: chance.integer({
                                min: 1,
                                max: 4
                            })
                        }),
                        transcript_id: i,
                        ipa_spelling: chance.string({pool: ipa_pool})
                    });
                }
            }

            return queryInterface.bulkInsert('collocation_occurrences', occurrences);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('collocation_occurrences');
    }
};
