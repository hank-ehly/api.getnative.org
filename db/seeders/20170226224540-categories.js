/**
 * 20170226224540-categories
 * get-native.com
 *
 * Created by henryehly on 2017/02/27.
 */

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('categories', [
            {name: 'Business'},
            {name: 'Food'},
            {name: 'Culture'},
            {name: 'Language'},
            {name: 'Sports'},
            {name: 'Entertainment'},
            {name: 'Family'},
            {name: 'Religion'}
        ]);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('categories');
    }
};
