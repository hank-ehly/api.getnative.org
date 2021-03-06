/**
 * 20170228230840-writing-questions-localized
 * api.getnative.org
 *
 * Created by henryehly on 2017/03/01.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const chance = require('chance').Chance();
const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const languages = await db[k.Model.Language].findAll();
        const writingQuestions = await db[k.Model.WritingQuestion].findAll();

        const writingQuestionsLocalized = [];

        const japaneseQuestions = [
            '自己紹介をお願いします',
            '自己PRをお願いします',
            'あなたを一言で表現してください',
            'あなたの強み・長所を教えてください',
            'あなたの弱み・短所を教えてください',
            '短所を改善するために心がけてることはありますか',
            'あなたを色（物・動物）に例えるとなんですか',
            '学生時代で最も頑張ったことを教えてください',
            '学生時代に出した成果を教えてください',
            '卒業研究の内容を教えてください',
            'アルバイトの内容を教えてください',
            '課外活動の内容を教えてください',
            'サークルやクラブ活動の内容を教えてください',
            '所属している組織でのあなたの役割を教えてください',
            'リーダーシップを取った経験はありますか',
            'まわりの方のあなたへの評価を教えてください',
            '学生時代に学んだ事は何ですか',
            '自分の大学生活を一言で表現してください',
            '成功体験を教えてください',
            '失敗体験を教えてください',
            '今まで一番感動したことを教えてください',
            '今までで一番うれしかったことは何ですか',
            '今までで一番悔しかったことは何ですか',
            'あなたが一番長く続けてきたことは何ですか',
            '最も得意であった授業を教えてください',
            '研究室（ゼミ）に入った理由を教えてください',
            '休学/留年した理由を教えてください',
            '趣味を教えてください',
            '尊敬する人を教えてください',
            '今まで一番感動したことを教えてください',
            'あなたの大切にしている言葉を教えてください',
            'あなたの夢を教えてください',
            'あなたは周りからどんな人だといわれますか',
            '友達の中でのあなたの役割、ポジションは',
            'あなたはどのような人が苦手ですか',
            '今後のキャリアプランを教えてください',
            '5年後、10年後の自分について教えてください',
            '死ぬときに何を考えると思いますか',
            'あなたにとって仕事とは何ですか',
            '仕事で大切だと思うこと何ですか',
            '仕事のやりがいは何だと思いますか',
            '仕事を通じてどのように成長したいですか',
            '仕事とプライベートはどちらが大切だと思いますか',
            '誰にも負けないと思うことは何ですか',
            'あなたを採用したら当社にどんなメリットがありますか',
            'あなたが面接官なら、自分自身を採用しますか',
            '当社の説明会の印象を教えてください',
            '当社のHPを見た感想（印象）を教えてください',
            '当社の業界を志望する理由を教えてください',
            '当社の業界の存在意義は何だと思いますか',
            '当社の業界に必要なものとは何だと考えていますか',
            '当社の業界は今後、どうなっていくと思いますか',
            '当社の業界を興味を持ったきっかけを教えてください',
            '当社を志望する理由を教えてください',
            '当社に興味を持ったきっかけを教えてください',
            '当社の印象/イメージを教えてください',
            '当社の理念や、ビジョンについてどのように考えていますか',
            '当社の強みや事業戦略についてどのように考えていますか',
            '当社のサービス、商品の魅力を教えてください',
            '当社の弱みはどこだと思いますか',
        ];

        const japaneseAnswers = [
            '前職では、営業職として働いておりました。若手に当たる私は、お客さまへの直接的な営業業務よりも社内で営業アシスタントとしての役割を担うことが多くありました。そのような業務を通して、電話でお客さまのサポートをしながら問題を解決していくことに喜びと自信を得ることができました。よりお客さまの身近な存在として問題を解決していきたい、また学生のころから興味のあったIT業界で、より専門性を高めた業務にチャレンジしていきたいという思いが強くなったことが、転職を考えるきっかけとなりました。今後は、ITという専門的な知識を身に付けながら、お客さまのサポートを行い、マネジメントも早くから担当するというコールセンターの業務で今までの経験を生かしていきたいと考えております。',
            '人間関係の不満などネガティブな理由で退職した場合に、正直に前職の愚痴などを話すのはいけません。実際に転職を考え始めた理由がネガティブだったとしても、それはきっかけに過ぎないと考え、「〜という目的を果たすために転職活動を行っている」というようにポジティブな理由を伝えましょう。',
            '私の長所は粘り強く最後まであきらめないことです。前職では、営業としてなかなか受注できない案件がありましたが、30回程お客さまを訪問し、最終的に大口の契約を取ることができました。短所は、仕事を背負いすぎてしまう部分があることです。つい自分でやろうとしてしまうのですが、今後は仲間と協力しながら、より速く正確に仕事を行っていきたいと思っております。',
            '短所はマイナスイメージになるという理由で、「短所は特にありません」と答えるのはいけません。誰にでも弱みとなるような部分はあるものです。完璧な人という受け取られ方ではなく、自己分析ができていない・自分に甘い人という印象を持たれてしまいかねないので注意しましょう。',
            '現在のWEBデザイナーとしての経験を積んだ後は、留学経験と前職で培った英語力を生かし、海外向けゲームのWEBディレクターを目指したいです。御社では今後ゲームのグローバル展開を考えていらっしゃると社長インタビューで拝見いたしました。現在展開されているゲームで英語対応しているものは15タイトル中2タイトルのみでしたので、将来ディレクターとして御社のグローバル事業推進に貢献していければと思っております。デザイナー経験で得た制作側の目線を生かし、デザインの差で生み出される効果やゲームの基礎、海外ユーザーのツボを抑えたゲームのディレクションを行っていきたいです。',
            '自身の考えるキャリアプランを先方に理解してもらおうと、感情を込めて熱く語りすぎるのはいけません。面接官はあなたの壮大な夢に興味を持っているわけではなく、自社でどんな仕事に携わっていきたいのかということを知りたいのです。企業情報を事前に調べ、その企業だからこそ実現できるキャリアプランだという点を伝えましょう。',
            '前職では、実績を正当に評価されないという点に不満を感じていました。「実力主義の企業」という点を魅力に感じて入社しましたが、実際は評価基準があいまいであり、上長次第で評価が大きくぶれる環境でした。評価基準を明確にし、営業目標を設けることで、個人のモチベーションアップと会社の利益につながると思い、評価制度の見直しについて社内で提案を行いました。具体的には、営業50人に直接ヒアリングし、今の評価制度について感じている不満や改善案などを取りまとめ、新しい評価制度を運用面まで企画しました。',
            '当時の状況を思い浮かべながら、感情的に不満点を説明するのはいけません。採用担当者はあなたの愚痴が聞きたいわけではありません。もし、不満の有無のみ質問をされた場合でも、それを解消しようと努力した点を一緒に伝えることが大切です。',
            '私は「どんなお客さまでも興味持ち、受注に結びつける」という点が強みだと思っています。前職の人材系企業にて営業として働き、幅広い業種のお客さまと接することができました。毎月800件の電話、200件の飛び込み訪問を通して、7カ月連続目標達成をすることができました。お付き合いのなかったお客さまとイチから関係性を構築し、受注するまでの流れを経験してきました。御社の営業職も、さまざまなお客さまにサービスを提供する仕事ですので、この経験を生かし活躍できると思っております。',
            '就職活動では、「御社に対する強い情熱を持っています」といった企業への熱い思いがアピールポイントになりましたが、転職ではあまりアピールになりません。その企業がいいという思いは大切ですが、なぜそこがいいのか実務面でどう貢献できるのかを合わせて伝えなければ、応募企業にメリットと感じてもらうことは難しいでしょう。'
        ];

        for (let writingQuestion of writingQuestions) {
            for (let language of languages) {
                let text = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseQuestions) : chance.sentence().replace(/\.$/, '?');
                let answer = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseAnswers) : chance.paragraph();
                writingQuestionsLocalized.push({
                    text: text,
                    example_answer: answer,
                    language_id: language.get(k.Attr.Id),
                    writing_question_id: writingQuestion.get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('writing_questions_localized', writingQuestionsLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('writing_questions_localized');
    }
};
