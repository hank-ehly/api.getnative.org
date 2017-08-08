/**
 * 20170226224545-categories-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/06.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const categories = await db[k.Model.Category].findAll();
        const languages = await db[k.Model.Language].findAll();
        const categoriesLocalized = [];

        const languageNameMap = [
            {en: 'Business', ja: 'ビジネス'},
            {en: 'Food', ja: '料理'},
            {en: 'Culture', ja: '文化'},
            {en: 'Language', ja: '言語'},
            {en: 'Sports', ja: 'スポーツ'},
            {en: 'Entertainment', ja: '娯楽'},
            {en: 'Family', ja: '家族'},
            {en: 'Religion', ja: '宗教'}
        ];

        for (let i = 0; i < categories.length; i++) {
            let category = categories[i];

            for (let j = 0; j < languages.length; j++) {
                let language = languages[j];
                let categoryId = category.get(k.Attr.Id);
                let name = languageNameMap[i][language.get(k.Attr.Code)] || 'unknown_' + language.get(k.Attr.Code) + '_' + categoryId;

                categoriesLocalized.push({
                    category_id: categoryId,
                    language_id: language.get(k.Attr.Id),
                    name: name
                });
            }
        }

        return queryInterface.bulkInsert('categories_localized', categoriesLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('categories_localized');
    }
};
