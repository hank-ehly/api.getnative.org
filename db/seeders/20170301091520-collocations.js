/**
 * 20170301091520-collocations
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const Transcript = require('../../app/models').Transcript;
const chance     = require('chance').Chance();
const Promise    = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Transcript.min('id'), Transcript.max('id')]).spread((minTranscriptId, maxTranscriptId) => {
            const collocations = [];
            const ipa_pool     = 'ɑæɐɑ̃βɓʙɕçðd͡ʒɖɗəɚɵɘɛɜɝɛ̃ɞɠʛɢɥɦɧħʜɪɪ̈ɨʝɟʄɫʟɬɭɮɱŋɲɴɳɔœøɒɔ̃ɶɸɐɾʁɹɻʀɽɺʃʂθt͡ʃt͡sʈʊʊ̈ʉʌʋⱱʍɯɰχʎʏʏɤɣʒʐʑʔʕʢʡ';

            for (let i = minTranscriptId; i <= maxTranscriptId; i++) {
                let numCollocations = chance.integer({
                    min: 5,
                    max: 10
                });

                for (let j = 0; j < numCollocations; j++) {
                    collocations.push({
                        description: chance.sentence(),
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

            return queryInterface.bulkInsert('collocations', collocations);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('collocations');
    }
};
