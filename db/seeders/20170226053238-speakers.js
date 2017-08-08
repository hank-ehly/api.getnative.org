/**
 * 20170226053238-speakers
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');

const _ = require('lodash');

module.exports = {
    up: async function(queryInterface) {
        const speakers = [];
        const genders = await db[k.Model.Gender].findAll({attributes: [k.Attr.Id]});
        for (let i = 0; i < 10; i++) {
            speakers.push({gender_id: _.sample(genders).get(k.Attr.Id)});
        }
        return queryInterface.bulkInsert('speakers', speakers);
    },

    down: function(queryInterface) {
        return queryInterface.bulkDelete('speakers');
    }
};
