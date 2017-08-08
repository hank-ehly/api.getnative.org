/**
 * 20170226045319-languages
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/26.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('languages', [
            {
                name: 'English',
                code: 'en'
            }, {
                name: '日本語',
                code: 'ja'
            }
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('languages', null, {});
    }
};
