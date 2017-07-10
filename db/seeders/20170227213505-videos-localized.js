/**
 * 20170227213505-videos-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/07/10.
 */

const k = require('../../config/keys.json');
const db = require('../../app/models');

const chance = require('chance').Chance();

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const languages = await db[k.Model.Language].findAll({attributes: [k.Attr.Id, k.Attr.Code]});
        const videos = await db[k.Model.Video].findAll({attributes: [k.Attr.Id]});
        const videosLocalized = [];

        const japaneseDescriptions = [
            'ローラという名は米国のテレビドラマ『大草原の小さな家』の登場人物「ローラ」に由来する。幼少の頃に両親が離婚。実父とともに実父の再婚相手となった中国人の継母と生活して育った。',
            '日本で生まれてすぐにバングラデシュへ移り現地のアメリカンスクールに通った。小学校1年生の時に日本へ帰り、しばらくして再びバングラデシュへ移住。',
            'やがて父の仕事の都合に伴い9歳で日本へ再入国。本人いわく「この頃から日本語がうまくなった」という。',
            'ローラは、おもに日本で活動するバラエティタレント、ファッションモデル、女優、歌手。バングラデシュ人、日本人、ロシア人の混血で、国籍は未詳。',
            '身長165センチメートル。東京都出身。父がバングラデシュ人、母が日本人の血を4分の3、ロシア人の血を4分の1受け継ぐ、いわゆるクォーター。',
            '芸能プロダクション / モデル事務所の会社は、モデルのローラを始めアナウンサー,モデル,役者,タレント,リポーターのプロフィール,出演情報,オーディションを掲載。',
            'ローラもまだ寝てるし起こすとうるさいのでそ～と外に出て1時間ほど龍ケ岡公園を散歩してきました。 たつのこ山へ登って知らない人たちと挨拶をかわしたり、お話しをしたり写真を撮ったり とても楽しかったです。'
        ];

        for (let video of videos) {
            for (let language of languages) {
                videosLocalized.push({
                    language_id: language.get(k.Attr.Id),
                    video_id: video.get(k.Attr.Id),
                    description: language.get(k.Attr.Code) === 'ja' ? chance.pickone(japaneseDescriptions) : chance.paragraph({sentences: 2})
                });
            }
        }

        return queryInterface.bulkInsert('videos_localized', videosLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('videos_localized');
    }
};
