/**
 * 20170226053238-speakers
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');
const Gender = db[k.Model.Gender];
const Language = db[k.Model.Language];

const chance = require('chance').Chance();
const Promise = require('bluebird');
const _ = require('lodash');

module.exports = {
    up: function(queryInterface, Sequelize) {
        const speakers = [];

        return Promise.join(Gender.findAll(), Language.findAll({attributes: [k.Attr.Id]}), function(genders, languages) {
            for (let i = 0; i < 50; i++) {
                let gender = _.sample(genders);

                speakers.push({
                    name: chance.name({gender: gender.get(k.Attr.Name)}),
                    location: chance.country({full: true}),
                    gender_id: gender.get(k.Attr.Id),
                    language_id: _.sample(languages).get(k.Attr.Id),
                    description: chance.paragraph({sentences: 2}),
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
