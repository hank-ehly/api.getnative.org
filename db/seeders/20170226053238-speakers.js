/**
 * 20170226053238-speakers
 * get-native.com
 *
 * Created by henryehly on 2017/02/26.
 */

const chance = require('chance').Chance();

module.exports = {
    up: function(queryInterface, Sequelize) {
        const speakers = [];

        for (let i = 0; i < 50; i++) {
            let bGender = chance.bool();

            speakers.push({
                name: chance.name({gender: bGender ? "male" : "female"}),
                location: chance.country({full: true}),
                gender: bGender,
                language_code: chance.pickone(['en', 'ja']),
                description: chance.paragraph({sentences: 2}),
                picture_url: 'https://dummyimage.com/100x100.png/5fa2dd/ffffff',
                is_silhouette_picture: chance.bool()
            });
        }

        return queryInterface.bulkInsert('speakers', speakers);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('speakers');
    }
};
