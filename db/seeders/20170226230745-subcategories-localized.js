/**
 * 20170226230745-subcategories-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');

const chance = require('chance').Chance();
const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const subcategories = await db[k.Model.Subcategory].findAll();
        const languages = await db[k.Model.Language].findAll();

        const subcategoriesLocalized = [];

        for (let subcategory of subcategories) {
            for (let language of languages) {

                let name;
                if (language.get(k.Attr.Code) === 'ja') {
                    name = chance.string({pool: 'あいうえおかきくけこさしすせそまみむめもらりるれろぱぴぷぺぽばびぶべぼはひふへほ'});
                } else {
                    name = chance.string({pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'});
                }

                subcategoriesLocalized.push({
                    name: name,
                    language_id: language.get(k.Attr.Id),
                    subcategory_id: subcategory.get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('subcategories_localized', subcategoriesLocalized);

    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('subcategories_localized');
    }
};
