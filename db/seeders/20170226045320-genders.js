/**
 * 20170226045320-genders
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/13.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('genders', [{name: 'male'}, {name: 'female'}]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('genders', null, {});
    }
};
