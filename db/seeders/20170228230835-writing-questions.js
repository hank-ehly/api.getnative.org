/**
 * 20170228230835-writing-questions
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const minSubcategoryId = await db[k.Model.Subcategory].min(k.Attr.Id);
        const maxSubcategoryId = await db[k.Model.Subcategory].max(k.Attr.Id);

        const writingQuestions = [];

        for (let i = minSubcategoryId; i <= maxSubcategoryId; i++) {
            for (let j = 0; j < 5; j++) {
                writingQuestions.push({
                    subcategory_id: i
                });
            }
        }

        return queryInterface.bulkInsert('writing_questions', writingQuestions);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('writing_questions');
    }
};
