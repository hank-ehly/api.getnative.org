/**
 * 20170301093349-usage-examples
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const CollocationOccurrence = require('../../app/models')[k.Model.CollocationOccurrence];

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([CollocationOccurrence.min(k.Attr.Id), CollocationOccurrence.max(k.Attr.Id)]).then(values => {
            const [minOccurrenceId, maxOccurrenceId] = values;
            const usageExamples = [];

            for (let i = minOccurrenceId; i <= maxOccurrenceId; i++) {
                let numUsageExamples = chance.integer({
                    min: 2,
                    max: 4
                });

                for (let j = 0; j < numUsageExamples; j++) {
                    usageExamples.push({
                        text: chance.sentence(),
                        collocation_occurrence_id: i
                    });
                }
            }

            return queryInterface.bulkInsert('usage_examples', usageExamples);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('usage_examples');
    }
};
