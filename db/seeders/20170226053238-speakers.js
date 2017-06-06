/**
 * 20170226053238-speakers
 * api.get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const Gender = db[k.Model.Gender];

const chance = require('chance').Chance();
const Promise = require('bluebird');
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const speakers = [];

        return Promise.join(Gender.findAll(), function(genders) {
            for (let i = 0; i < 50; i++) {
                let gender = _.sample(genders);

                speakers.push({
                    gender_id: gender.get(k.Attr.Id),
                    picture_url: 'https://dummyimage.com/100x100.png/5fa2dd/ffffff',
                    is_silhouette_picture: chance.bool()
                });
            }

            return queryInterface.bulkInsert('speakers', speakers);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('speakers');
    }
};
