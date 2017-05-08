/**
 * 20170301093349-usage-examples
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const Collocation = require('../../app/models').Collocation;
const chance      = require('chance').Chance();
const Promise     = require('bluebird');

module.exports = {
    up: function(queryInterface, Sequelize) {
        return Promise.all([Collocation.min('id'), Collocation.max('id')]).spread((minCollocationId, maxCollocationId) => {
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
