/**
 * 20170301093349-usage-examples
 * api.get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const k = require('../../config/keys.json');
const Collocation = require('../../app/models')[k.Model.Collocation];

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Collocation.min(k.Attr.Id), Collocation.max(k.Attr.Id)]).then(values => {
            const [minCollocationId, maxCollocationId] = values;
            const usageExamples = [];

            for (let i = minCollocationId; i <= maxCollocationId; i++) {
                let numUsageExamples = chance.integer({
                    min: 2,
                    max: 4
                });

                for (let j = 0; j < numUsageExamples; j++) {
                    usageExamples.push({
                        text: chance.sentence(),
                        collocation_id: i
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
