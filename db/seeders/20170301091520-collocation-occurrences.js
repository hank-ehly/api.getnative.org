/**
 * 20170301091520-collocation-occurrences
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const jaCorpus = require('../fixtures/ja-corpus.json');
const enWords = require('../fixtures/en-words.json');
const _ = require('lodash');

const chance = require('chance').Chance();

function getJACollocation() {
    let phrase = _.sample(jaCorpus);
    let to = chance.natural({min: 2, max: Math.floor(phrase.length / 4)});
    return phrase.substring(0, to);
}

function getENCollocation() {
    const count = chance.natural({min: 1, max: 4});
    return _.sampleSize(enWords, count).join(' ');
}

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const occurrences = [];
        const ipa_pool = 'ɑæɐɑ̃βɓʙɕçðd͡ʒɖɗəɚɵɘɛɜɝɛ̃ɞɠʛɢɥɦɧħʜɪɪ̈ɨʝɟʄɫʟɬɭɮɱŋɲɴɳɔœøɒɔ̃ɶɸɐɾʁɹɻʀɽɺʃʂθt͡ʃt͡sʈʊʊ̈ʉʌʋⱱʍɯɰχʎʏʏɤɣʒʐʑʔʕʢʡ';

        const transcripts = await db[k.Model.Transcript].findAll({
            attributes: [k.Attr.Id],
            include: {
                model: db[k.Model.Language],
                attributes: [k.Attr.Code],
                as: 'language'
            }
        });

        for (let transcript of transcripts) {
            const numberOfOccurrences = chance.natural({min: 1, max: 5});
            for (let i = 0; i < numberOfOccurrences; i++) {
                let text = transcript.get('language').get(k.Attr.Code) === 'ja' ? getJACollocation() : getENCollocation();
                occurrences.push({
                    transcript_id: transcript.get(k.Attr.Id),
                    ipa_spelling: chance.string({pool: ipa_pool}),
                    text: text
                });
            }
        }

        return queryInterface.bulkInsert('collocation_occurrences', occurrences);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('collocation_occurrences');
    }
};
