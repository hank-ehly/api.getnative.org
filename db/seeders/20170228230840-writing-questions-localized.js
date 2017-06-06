/**
 * 20170228230840-writing-questions-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const chance = require('chance').Chance();

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const languages = await db[k.Model.Language].findAll();
        const writingQuestions = await db[k.Model.WritingQuestion].findAll();

        const writingQuestionsLocalized = [];

        for (let writingQuestion of writingQuestions) {
            for (let language of languages) {
                writingQuestionsLocalized.push({
                    text: [language.get(k.Attr.Code), '_', chance.sentence().replace(/\.$/, '?')].join(''),
                    example_answer: [language.get(k.Attr.Code), '_', chance.paragraph()].join(''),
                    language_id: language.get(k.Attr.Id),
                    writing_question_id: writingQuestion.get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('writing_questions_localized', writingQuestionsLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('writing_questions_localized');
    }
};
