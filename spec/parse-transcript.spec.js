/* Testing logic for transcript parsing */

const english = `
    I actually have {a number of} different hobbies. Uhm, {first off} there's music. 
    I grew up in a pretty musical family and my grandpa is actually a famous conductor, 
    so I've been doing music or at least I've been around music {since I was a little kid}. 
    I play the drums and I actually went to school in Nashville Tennessee {for a bit} to study 
    percussion before switching over to my.. to the school I graduated from which is the University of Kansas. 
    {I have a passion for} learning languages as well. I can speak a couple different ones including Japanese and Spanish. 
    {Other than that}, I enjoy programming too. Uhm, particularly web-related stuff. Backend is more {what I'm into}.
`;

const japanese = `
    久しぶりに家族に会いに行きました。{一週間半くらい}会社休んでアメリカに行った。お母さんとが{空港まで迎えに来てくれた}。その後家に帰ってスープを作ってくれた。
    お父さんが午後6時くらいに仕事から帰って来て、3人で{色々とお話ができた}。家族と過ごすことはとても大切ですけど、あまりにも家族のそばにいようとすると自分自身で
    物事を考えて独立して生活{できなくなる危険性}もあると思います。私は元々アメリカに住んでいたが、二十歳で{日本に引っ越した}のです。日本はいい国だが、人はアメリカより
    排他的で、{孤独になりやすい}タイプだと思います。
`;

const _ = require('lodash');

function parse(text) {
    if (!text) {
        throw new ReferenceError('text argument is required');
    }

    if (!_.isString(text)) {
        throw new TypeError('text argument must be a string');
    }

    const curlyBraceExp = new RegExp('\{[^\{\}]+\}', 'g');

    const trimmed       = _.trim(text);
    const inline        = trimmed.replace(/[\n\t]/g, '').replace(/\s+/g, ' ');
    const wrappedItems  = inline.match(curlyBraceExp);
    return wrappedItems.map(i => i.replace('{', '').replace('}', ''));
}

/* Spec */

const assert = require('assert');

describe('parse', function() {
    it(`should throw a ReferenceError if no text is specified`, function() {
        assert.throws(function() {
            parse();
        }, ReferenceError);
    });

    it(`should throw a TypeError if the text argument is not a string`, function() {
        assert.throws(function() {
            parse(_.stubObject());
        }, TypeError);
    });

    it(`should return an array`, function() {
        assert(_.isArray(parse(english)));
    });

    it(`should create an array of 7 strings - English`, function() {
        assert.equal(parse(english).length, 7);
    });

    it(`should create an array of 6 strings - Japanese`, function() {
        assert.equal(parse(japanese).length, 6);
    });

    it(`should create an array of strings with the correct contents - English`, function() {
        const expected = [
            'a number of',
            'first off',
            'since I was a little kid',
            'for a bit',
            'I have a passion for',
            'Other than that',
            'what I\'m into'
        ];

        let actual = parse(english);

        assert.equal(_.difference(actual, expected).length, 0);
    });

    it(`should create an array of strings with the correct contents - Japanese`, function() {
        const expected = [
            '一週間半くらい',
            '空港まで迎えに来てくれた',
            '色々とお話ができた',
            'できなくなる危険性',
            '日本に引っ越した',
            '孤独になりやすい'
        ];

        let actual = parse(japanese);

        assert.equal(_.difference(actual, expected).length, 0);
    });
});
