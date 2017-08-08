/**
 * 20170226230745-subcategories-localized
 * api.getnativelearning.com
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

        const japaneseWordPool = [
            'ホ・ギ・ラ・ラ',
            '船を降りたら彼女の島',
            'わたしのグランパ',
            '北の零年',
            '包帯クラブ',
            '銀幕版 スシ王子! 〜ニューヨークへ行く〜',
            'フライング☆ラビッツ',
            '人間失格',
            '座頭市',
            'インシテミル 7日間のデス・ゲーム',
            '漫才ギャング',
            '月光ノ仮面',
            '〜ささやかな欲望〜',
            'カラスの親指',
            'モンスターズ',
            '幕末高校生',
            '風に立つライオン',
            '進撃の巨人',
            'シン・ゴジラ',
            '忍びの国',
            '窓を開けたら',
            'きみはペット',
            '連続テレビ小説 てるてる家族',
            '天国への応援歌 チアーズ〜チアリーディングにかけた青春〜',
            '君といた日々',
            '大河ドラマ 義経',
            '赤い疑惑',
            '怪談スペシャル',
            'クライマーズ・ハイ',
            '氷点',
            '翼の折れた天使たち',
            '花嫁とパパ',
            '世にも奇妙な物語',
            '世にも奇妙な物語 秋の特別編',
            '長生き競争!',
            '大仏開眼'
        ];

        const subcategoriesLocalized = [];

        for (let subcategory of subcategories) {
            for (let language of languages) {
                let name = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseWordPool) : chance.sentence({words: 2});
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
