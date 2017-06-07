/**
 * 20170226053239-speakers-localized
 * api.get-native.com
 *
 * Created by henryehly on 2017/06/06.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');

const chance = require('chance').Chance();
const _ = require('lodash');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        const speakersLocalized = [];

        const speakers = await db[k.Model.Speaker].findAll({
            include: [
                {
                    model: db[k.Model.Gender],
                    attributes: [k.Attr.Name],
                    as: 'gender'
                }
            ]
        });

        const japaneseNames = [
            "山崎",
            "森",
            "池田",
            "橋本",
            "阿部",
            "石川",
            "山下",
            "中島",
            "小川",
            "石井",
            "前田",
            "岡田",
            "長谷川",
            "藤田",
            "後藤",
            "近藤",
            "村上",
            "遠藤",
            "青木",
            "坂本",
            "斉藤",
            "福田",
            "太田",
            "西村",
            "藤井",
            "藤原",
            "岡本",
            "三浦",
            "金子",
            "中野",
            "中川",
            "原田",
            "松田",
            "竹内",
            "小野",
            "田村",
            "中山",
            "和田",
            "石田",
            "森田",
            "上田",
            "原",
            "内田",
            "柴田",
            "酒井",
            "宮崎",
            "横山",
            "高木",
            "安藤",
            "宮本",
            "大野",
            "小島",
            "工藤",
            "谷口",
            "今井",
            "高田",
            "丸山",
            "増田",
            "杉山",
            "村田",
            "大塚",
            "小山",
            "藤本",
            "平野",
            "新井",
            "河野",
            "上野",
            "武田",
            "野口",
            "松井",
            "千葉",
            "菅原",
            "岩崎",
            "久保",
            "木下",
            "佐野",
            "野村",
            "松尾",
            "菊地",
            "杉本",
            "市川",
            "古川",
            "大西",
            "島田",
            "水野",
            "桜井",
            "渡部",
            "高野",
            "吉川",
            "山内",
            "西田",
            "菊池",
            "飯田",
            "西川",
            "小松",
            "北村",
            "安田",
            "五十嵐",
            "川口",
            "平田",
            "関",
            "中田",
            "久保田",
            "東",
            "服部",
            "川崎",
            "岩田",
            "土屋",
            "福島",
            "本田",
            "辻",
            "樋口",
            "田口",
            "永井",
            "秋山",
            "山中",
            "中西",
            "吉村",
            "川上",
            "大橋",
            "石原",
            "松岡",
            "浜田",
            "馬場",
            "森本",
            "矢野",
            "浅野",
            "松下",
            "星野",
            "大久保",
            "吉岡",
            "小池",
            "野田",
            "荒木",
            "熊谷",
            "松浦",
            "大谷",
            "内藤",
            "黒田",
            "尾崎",
            "川村",
            "永田",
            "望月",
            "堀",
            "松村",
            "田辺",
            "菅野",
            "荒井",
            "平井",
            "大島",
            "西山",
            "早川",
            "栗原",
            "広瀬",
            "横田",
            "石橋",
            "岩本",
            "片山",
            "萩原",
            "関口",
            "宮田",
            "大石",
            "本間",
            "須藤",
            "高山",
            "岡崎",
            "小田",
            "吉野",
            "鎌田",
            "伊東",
            "篠原",
            "上原",
            "小西",
            "松原",
            "福井",
            "成田",
            "古賀",
            "大森",
            "南",
            "小泉"
        ];

        const japaneseLocations = [
            "名古屋市",
            "豊橋市",
            "岡崎市",
            "一宮市",
            "瀬戸市",
            "半田市",
            "春日井市",
            "豊川市",
            "津島市",
            "碧南市",
            "刈谷市",
            "豊田市",
            "安城市",
            "西尾市",
            "蒲郡市",
            "犬山市",
            "常滑市",
            "江南市",
            "小牧市",
            "稲沢市",
            "東海市",
            "大府市",
            "知多市",
            "知立市",
            "尾張旭市",
            "高浜市",
            "岩倉市",
            "豊明市",
            "日進市",
            "田原市",
            "愛西市",
            "清須市",
            "新城市",
            "北名古屋市",
            "弥富市",
            "みよし市",
            "あま市",
            "長久手市",
            "秋田市",
            "大館市",
            "鹿角市",
            "大仙市",
            "潟上市",
            "北秋田市",
            "男鹿市",
            "由利本荘市",
            "湯沢市",
            "仙北市",
            "横手市",
            "にかほ市",
            "能代市",
            "八戸市",
            "黒石市",
            "三沢市",
            "むつ市",
            "十和田市",
            "つがる市",
            "五所川原市",
            "青森市",
            "平川市",
            "弘前市",
            "千葉市",
            "銚子市",
            "市川市",
            "船橋市",
            "館山市",
            "木更津市",
            "松戸市",
            "野田市",
            "茂原市",
            "成田市",
            "佐倉市",
            "東金市",
            "習志野市",
            "柏市",
            "勝浦市",
            "市原市",
            "流山市",
            "八千代市",
            "我孫子市",
            "鎌ヶ谷市",
            "君津市",
            "富津市",
            "浦安市",
            "四街道市",
            "袖ヶ浦市",
            "八街市",
            "印西市",
            "白井市",
            "富里市",
            "鴨川市",
            "旭市",
            "いすみ市",
            "匝瑳市",
            "南房総市",
            "香取市",
            "山武市",
            "大網白里市",
            "松山市",
            "新居浜市",
            "四国中央市",
            "西予市",
            "東温市",
            "西条市",
            "大洲市",
            "今治市",
            "八幡浜市",
            "伊予市",
            "宇和島市",
            "福井市",
            "敦賀市",
            "小浜市",
            "大野市",
            "勝山市",
            "鯖江市",
            "あわら市",
            "越前市",
            "坂井市",
            "福岡市",
            "久留米市",
            "大牟田市",
            "直方市",
            "田川市",
            "柳川市",
            "八女市",
            "筑後市",
            "大川市",
            "行橋市",
            "豊前市",
            "中間市",
            "北九州市",
            "小郡市",
            "筑紫野市",
            "春日市",
            "大野城市",
            "宗像市",
            "太宰府市",
            "古賀市",
            "福津市",
            "うきは市",
            "宮若市",
            "朝倉市",
            "飯塚市",
            "嘉麻市",
            "みやま市",
            "糸島市",
            "会津若松市",
            "福島市",
            "郡山市",
            "須賀川市",
            "相馬市",
            "いわき市",
            "田村市",
            "白河市",
            "二本松市",
            "南相馬市",
            "伊達市",
            "喜多方市",
            "本宮市",
            "岐阜市",
            "大垣市",
            "高山市",
            "多治見市",
            "関市",
            "中津川市",
            "美濃市",
            "瑞浪市",
            "羽島市",
            "美濃加茂市",
            "土岐市",
            "各務原市",
            "可児市",
            "山県市",
            "瑞穂市",
            "飛騨市",
            "本巣市",
            "郡上市",
            "下呂市",
            "恵那市",
            "海津市",
            "前橋市",
            "高崎市",
            "桐生市",
            "伊勢崎市",
            "太田市",
            "沼田市",
            "館林市",
            "藤岡市",
            "渋川市",
            "安中市",
            "富岡市",
            "みどり市",
            "広島市",
            "尾道市",
            "呉市",
            "福山市",
            "三原市",
            "府中市",
            "三次市",
            "庄原市",
            "大竹市",
            "竹原市",
            "東広島市",
            "廿日市市",
            "安芸高田市",
            "江田島市",
            "札幌市",
            "函館市",
            "小樽市",
            "旭川市",
            "室蘭市",
            "帯広市",
            "夕張市",
            "岩見沢市",
            "網走市",
            "留萌市",
            "苫小牧市",
            "稚内市",
            "美唄市",
            "芦別市",
            "江別市",
            "赤平市",
            "紋別市",
            "三笠市",
            "根室市",
            "千歳市",
            "滝川市",
            "砂川市",
            "歌志内市",
            "深川市",
            "富良野市",
            "登別市",
            "恵庭市",
            "伊達市",
            "北広島市",
            "石狩市",
            "士別市",
            "釧路市",
            "北斗市",
            "北見市",
            "名寄市",
            "神戸市",
            "姫路市",
            "尼崎市",
            "明石市",
            "西宮市",
            "芦屋市",
            "伊丹市",
            "相生市",
            "豊岡市",
            "加古川市",
            "赤穂市",
            "宝塚市",
            "三木市",
            "高砂市",
            "川西市",
            "小野市",
            "三田市",
            "加西市",
            "篠山市",
            "養父市",
            "丹波市",
            "南あわじ市",
            "朝来市",
            "淡路市",
            "宍粟市",
            "西脇市",
            "たつの市",
            "洲本市",
            "加東市",
            "水戸市",
            "日立市",
            "土浦市",
            "結城市",
            "龍ヶ崎市",
            "下妻市",
            "常総市",
            "常陸太田市",
            "高萩市",
            "北茨城市",
            "取手市",
            "牛久市",
            "つくば市",
            "ひたちなか市",
            "鹿嶋市",
            "潮来市",
            "守谷市",
            "常陸大宮市",
            "那珂市",
            "坂東市",
            "稲敷市",
            "筑西市",
            "かすみがうら市",
            "神栖市",
            "行方市",
            "古河市",
            "石岡市",
            "桜川市",
            "鉾田市",
            "笠間市",
            "つくばみらい市",
            "小美玉市",
            "金沢市",
            "野々市市",
            "七尾市",
            "小松市",
            "珠洲市",
            "羽咋市",
            "かほく市",
            "白山市",
            "能美市",
            "加賀市",
            "輪島市",
            "盛岡市",
            "釜石市",
            "大船渡市",
            "陸前高田市",
            "北上市",
            "宮古市",
            "八幡平市",
            "一関市",
            "遠野市",
            "花巻市",
            "二戸市",
            "奥州市",
            "久慈市",
            "滝沢市",
            "高松市",
            "丸亀市",
            "坂出市",
            "善通寺市",
            "さぬき市",
            "東かがわ市",
            "観音寺市",
            "三豊市",
            "鹿児島市",
            "鹿屋市",
            "枕崎市",
            "阿久根市",
            "出水市",
            "指宿市",
            "南さつま市",
            "西之表市",
            "垂水市",
            "薩摩川内市",
            "日置市",
            "曽於市",
            "いちき串木野市",
            "霧島市",
            "志布志市",
            "奄美市",
            "南九州市",
            "伊佐市",
            "姶良市",
            "横浜市",
            "横須賀市",
            "川崎市",
            "平塚市",
            "鎌倉市",
            "藤沢市",
            "小田原市",
            "茅ヶ崎市",
            "逗子市",
            "相模原市",
            "三浦市",
            "秦野市",
            "厚木市",
            "大和市",
            "伊勢原市",
            "海老名市",
            "座間市",
            "南足柄市",
            "綾瀬市",
            "高知市",
            "宿毛市",
            "安芸市",
            "土佐清水市",
            "須崎市",
            "土佐市",
            "室戸市",
            "南国市",
            "四万十市",
            "香美市",
            "香南市",
            "熊本市",
            "八代市",
            "人吉市",
            "荒尾市",
            "水俣市",
            "玉名市",
            "山鹿市",
            "菊池市",
            "宇土市",
            "上天草市",
            "宇城市",
            "阿蘇市",
            "合志市",
            "天草市",
            "京都市",
            "福知山市",
            "舞鶴市",
            "綾部市",
            "宇治市",
            "宮津市",
            "亀岡市",
            "城陽市",
            "向日市",
            "長岡京市",
            "八幡市",
            "京田辺市",
            "京丹後市",
            "南丹市",
            "木津川市",
            "四日市市",
            "松阪市",
            "桑名市",
            "鈴鹿市",
            "名張市",
            "尾鷲市",
            "亀山市",
            "鳥羽市",
            "いなべ市",
            "志摩市",
            "伊賀市",
            "伊勢市",
            "熊野市",
            "津市",
            "仙台市",
            "石巻市",
            "塩竈市",
            "白石市",
            "名取市",
            "角田市",
            "多賀城市",
            "岩沼市",
            "登米市",
            "栗原市",
            "東松島市",
            "気仙沼市",
            "大崎市",
            "富谷市",
            "宮崎市",
            "都城市",
            "延岡市",
            "日南市",
            "小林市",
            "日向市",
            "串間市",
            "西都市",
            "えびの市",
            "松本市",
            "岡谷市",
            "諏訪市",
            "須坂市",
            "小諸市",
            "駒ヶ根市",
            "大町市",
            "飯山市",
            "飯田市",
            "茅野市",
            "塩尻市",
            "長野市",
            "千曲市",
            "東御市",
            "中野市",
            "佐久市",
            "安曇野市",
            "上田市",
            "伊那市",
            "長崎市",
            "佐世保市",
            "島原市",
            "大村市",
            "対馬市",
            "壱岐市",
            "五島市",
            "諫早市",
            "西海市",
            "平戸市",
            "雲仙市",
            "松浦市",
            "南島原市",
            "奈良市",
            "大和高田市",
            "大和郡山市",
            "天理市",
            "橿原市",
            "桜井市",
            "五條市",
            "御所市",
            "生駒市",
            "香芝市",
            "葛城市",
            "宇陀市",
            "新潟市",
            "長岡市",
            "柏崎市",
            "新発田市",
            "小千谷市",
            "加茂市",
            "見附市",
            "村上市",
            "妙高市",
            "上越市",
            "佐渡市",
            "阿賀野市",
            "魚沼市",
            "南魚沼市",
            "糸魚川市",
            "十日町市",
            "三条市",
            "胎内市",
            "五泉市",
            "燕市",
            "大分市",
            "別府市",
            "中津市",
            "日田市",
            "佐伯市",
            "臼杵市",
            "津久見市",
            "竹田市",
            "豊後高田市",
            "宇佐市",
            "豊後大野市",
            "杵築市",
            "由布市",
            "国東市",
            "岡山市",
            "倉敷市",
            "津山市",
            "玉野市",
            "笠岡市",
            "井原市",
            "総社市",
            "高梁市",
            "新見市",
            "備前市",
            "瀬戸内市",
            "赤磐市",
            "真庭市",
            "美作市",
            "浅口市",
            "那覇市",
            "石垣市",
            "宜野湾市",
            "浦添市",
            "名護市",
            "糸満市",
            "沖縄市",
            "豊見城市",
            "うるま市",
            "宮古島市",
            "南城市",
            "大阪市",
            "堺市",
            "岸和田市",
            "豊中市",
            "池田市",
            "吹田市",
            "泉大津市",
            "高槻市",
            "貝塚市",
            "守口市",
            "枚方市",
            "茨木市",
            "八尾市",
            "泉佐野市",
            "富田林市",
            "寝屋川市",
            "河内長野市",
            "松原市",
            "大東市",
            "和泉市",
            "箕面市",
            "柏原市",
            "羽曳野市",
            "門真市",
            "摂津市",
            "高石市",
            "藤井寺市",
            "東大阪市",
            "泉南市",
            "四条畷市",
            "交野市",
            "大阪狭山市",
            "阪南市",
            "鳥栖市",
            "伊万里市",
            "鹿島市",
            "多久市",
            "唐津市",
            "小城市",
            "佐賀市",
            "嬉野市",
            "武雄市",
            "神埼市",
            "川越市",
            "川口市",
            "行田市",
            "秩父市",
            "所沢市",
            "飯能市",
            "加須市",
            "東松山市",
            "狭山市",
            "羽生市",
            "鴻巣市",
            "上尾市",
            "草加市",
            "越谷市",
            "蕨市",
            "戸田市",
            "入間市",
            "朝霞市",
            "志木市",
            "和光市",
            "新座市",
            "桶川市",
            "久喜市",
            "北本市",
            "八潮市",
            "富士見市",
            "三郷市",
            "蓮田市",
            "坂戸市",
            "幸手市",
            "鶴ヶ島市",
            "日高市",
            "吉川市",
            "さいたま市",
            "熊谷市",
            "春日部市",
            "ふじみ野市",
            "深谷市",
            "本庄市",
            "白岡市",
            "大津市",
            "彦根市",
            "草津市",
            "守山市",
            "栗東市",
            "甲賀市",
            "野洲市",
            "湖南市",
            "高島市",
            "東近江市",
            "米原市",
            "長浜市",
            "近江八幡市",
            "松江市",
            "出雲市",
            "益田市",
            "安来市",
            "江津市",
            "雲南市",
            "浜田市",
            "大田市",
            "静岡市",
            "浜松市",
            "沼津市",
            "熱海市",
            "三島市",
            "富士宮市",
            "伊東市",
            "島田市",
            "磐田市",
            "焼津市",
            "掛川市",
            "藤枝市",
            "御殿場市",
            "袋井市",
            "富士市",
            "下田市",
            "裾野市",
            "湖西市",
            "伊豆市",
            "御前崎市",
            "菊川市",
            "伊豆の国市",
            "牧之原市",
            "宇都宮市",
            "足利市",
            "栃木市",
            "鹿沼市",
            "小山市",
            "真岡市",
            "大田原市",
            "矢板市",
            "那須塩原市",
            "佐野市",
            "さくら市",
            "那須烏山市",
            "下野市",
            "日光市",
            "徳島市",
            "鳴門市",
            "小松島市",
            "阿南市",
            "吉野川市",
            "美馬市",
            "阿波市",
            "三好市",
            "八王子市",
            "立川市",
            "武蔵野市",
            "三鷹市",
            "青梅市",
            "府中市",
            "昭島市",
            "調布市",
            "町田市",
            "小金井市",
            "小平市",
            "日野市",
            "東村山市",
            "国分寺市",
            "国立市",
            "福生市",
            "狛江市",
            "東大和市",
            "清瀬市",
            "東久留米市",
            "武蔵村山市",
            "多摩市",
            "稲城市",
            "羽村市",
            "あきる野市",
            "西東京市",
            "東京特別区部",
            "足立区",
            "荒川区",
            "文京区",
            "千代田区",
            "中央区",
            "江戸川区",
            "板橋区",
            "葛飾区",
            "北区",
            "江東区",
            "目黒区",
            "港区",
            "中野区",
            "練馬区",
            "大田区",
            "世田谷区",
            "渋谷区",
            "品川区",
            "新宿区",
            "杉並区",
            "墨田区",
            "台東区",
            "豊島区",
            "鳥取市",
            "米子市",
            "倉吉市",
            "境港市",
            "富山市",
            "魚津市",
            "氷見市",
            "滑川市",
            "砺波市",
            "小矢部市",
            "南砺市",
            "高岡市",
            "射水市",
            "黒部市",
            "和歌山市",
            "海南市",
            "田辺市",
            "御坊市",
            "有田市",
            "新宮市",
            "紀の川市",
            "橋本市",
            "岩出市",
            "山形市",
            "米沢市",
            "新庄市",
            "寒河江市",
            "上山市",
            "村山市",
            "長井市",
            "天童市",
            "東根市",
            "尾花沢市",
            "南陽市",
            "鶴岡市",
            "酒田市",
            "宇部市",
            "防府市",
            "下松市",
            "周南市",
            "光市",
            "下関市",
            "柳井市",
            "萩市",
            "長門市",
            "山陽小野田市",
            "山口市",
            "岩国市",
            "美祢市",
            "甲府市",
            "富士吉田市",
            "都留市",
            "大月市",
            "韮崎市",
            "南アルプス市",
            "甲斐市",
            "笛吹市",
            "北杜市",
            "上野原市",
            "山梨市",
            "甲州市",
            "中央市"
        ];

        const japaneseDescriptions = [
            '石原 さとみ（いしはら さとみ、1986年12月24日 - ）は、日本の女優。本名は非公開。東京都出身。ホリプロ所属。',
            '井川 遥（いがわ はるか、1976年6月29日 - ）は、日本の女優である。本名非公開。エフ・エム・ジー所属。',
            '鈴木 えみ（すずき えみ、1985年9月13日 - ）は、日本のファッションモデル、投資家、実業家。愛称は、えみちぃ。 スターダストプロモーション所属。',
            '平子理沙さんは、「アラフォーの星」と言われるカリスマモデルです。40代とは思えない若々しい肌やヘアスタイル、ファッションには多くの注目が集まりますが、それ以上に言われているのが顔の劣化や整形疑惑、そして短足ぶり。',
            '人気モデルの平子理沙（44）が吉田栄作（47）と離婚したのは昨年の12月21日。独身に戻って年を越した平子だが、さすが美魔女のカリスマと言うべきか。離婚成立前にしっかりと“次の男”をゲットしていた。',
            '織田裕二、吉田栄作と共に平成御三家と呼ばれ人気俳優だった加勢大周さん。過去には事務所とのトラブルや逮捕等、トラブルも多く現在はめっきり見かけなくなりました。加勢大周さんは現在なにをしているのでしょうか',
            '保阪尚希（俳優）から高岡早紀へ妻の不貞をどうやって許したか. ベストセラー『大人の流儀』シリーズの第4弾『許す力』。発売3週間で早くも17万部に. 04年に彼女とミュージシャン（布袋寅泰）の不倫報道が出たとき、僕はマレーシアにいました。',
            '萩原聖人といえば、「若者のすべて」で脚光を浴びていましたが、現在何をしているのでしょう？一時期若手俳優の中でも有望だったのに、現在ではほとんど見かけることはありません。',
            '俳優の萩原流行さんがオートバイを運転中に警視庁の護送車に接触して死亡した事故で、警視庁は「運転手の不注意が原因だった可能性がある」と新たに発表しました。 これは5月22日に警視庁が発表した物で、同日には警視庁の捜査に',
            'はしご酒にショーケンこと、萩原健一さんが登場します！まっちゃんのボケも、浜ちゃんの突っ込みも聞かずに場の空気を凍り付かせたそうですね！坂上忍さんですら恐れているという萩原健一さん。若いころの伝説や女性遍歴、そしてあの事件',
            '井上堯之（いのうえ たかゆき、1941年3月15日 - ）は、日本のミュージシャン・ギタリスト・作曲家・歌手・音楽プロデューサー。兵庫県神戸市出身。本名は同じ。別名は井上 孝之。愛称はイノヤン。',
            '京都・大阪のジャズ喫茶を中心に、スチールギター奏者としてデビュー。 62年、ザ・スパイダースのメンバーとなり、10年間活躍する。 解散後、沢田研二、萩原健一等と共にPYG（ピッグ）を結成。その後、井上堯之バンドに参加し、解散後大野克夫バンドを結成。'
        ];

        const languages = await db[k.Model.Language].findAll();

        for (let speaker of speakers) {
            const gender = speaker.get('gender').get(k.Attr.Name).toLowerCase();
            const description = chance.paragraph({sentences: 2});

            for (let language of languages) {
                let name = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseNames) : chance.name({gender: gender});
                let location = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseLocations) : chance.country({full: true});
                let description = language.get(k.Attr.Code) === 'ja' ? _.sample(japaneseDescriptions) : chance.paragraph({sentences: 2});

                speakersLocalized.push({
                    name: name,
                    location: location,
                    language_id: language.get(k.Attr.Id),
                    description: description,
                    speaker_id: speaker.get(k.Attr.Id)
                });
            }
        }

        return queryInterface.bulkInsert('speakers_localized', speakersLocalized);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('speakers_localized');
    }
};
