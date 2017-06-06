/**
 * 20170226053239-speakers-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const chance = require('chance').Chance();

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const speakersLocalized = [];

        const speakers = await db[k.Model.Speaker].findAll({
            include: [
                {
                    model: db[k.Model.Gender],
                    attributes: [k.Attr.Name],
                    as: 'gender'
                }
            ]
        });

        const languages = await db[k.Model.Language].findAll();

        for (let speaker of speakers) {
            const gender = speaker.get('gender').get(k.Attr.Name).toLowerCase();
            const location = chance.country({full: true});
            const description = chance.paragraph({sentences: 2});

            for (let language of languages) {
                speakersLocalized.push({
                    name:        language.get(k.Attr.Code) + '_' + chance.name({gender: gender}),
                    location:    language.get(k.Attr.Code) + '_' + location,
                    language_id: language.get(k.Attr.Id),
                    description: language.get(k.Attr.Code) + '_' + description,
                    speaker_id:  speaker.get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('speakers_localized', speakersLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('speakers_localized');
    }
};
