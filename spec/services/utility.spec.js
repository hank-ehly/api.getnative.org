/**
 * utility.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/14.
 */

const Utility = require('../../app/services')['Utility'];

const m = require('mocha');
const [describe, it] = [m.describe, m.it];
const assert = require('assert');
const _ = require('lodash');

describe('Utility', function() {
    describe('extractAuthTokenFromRequest', function() {
        it('should throw a RangeError if the number of arguments is less than 1', function() {
            assert.throws(function() {
                Utility.extractAuthTokenFromRequest()
            }, RangeError);
        });

        it('should throw a RangeError if the number of arguments is greater than 1', function() {
            assert.throws(function() {
                Utility.extractAuthTokenFromRequest({}, {})
            }, RangeError);
        });

        it(`should throw a TypeError if the first argument does not have a 'headers' property of object type`, function() {
            assert.throws(function() {
                Utility.extractAuthTokenFromRequest({foo: 'bar'})
            }, TypeError);
        });

        it(`should throw a ReferenceError if the request object does not have an 'authorization' property of string type`, function() {
            assert.throws(function() {
                Utility.extractAuthTokenFromRequest({headers: {foo: 'bar'}})
            }, ReferenceError);
        });

        it(`should throw a SyntaxError if the requests' 'authorization' header field value is not correctly formatted`, function() {
            assert.throws(function() {
                Utility.extractAuthTokenFromRequest({headers: {authorization: ''}})
            }, SyntaxError);
        });

        it('should return a string', function() {
            let retVal = Utility.extractAuthTokenFromRequest({headers: {authorization: 'Bearer XXX.XXX.XXX'}});
            assert(_.isString(retVal));
        });

        it('should return a string whose length is greater than 0', function() {
            let retVal = Utility.extractAuthTokenFromRequest({headers: {authorization: 'Bearer XXX.XXX.XXX'}});
            assert(retVal.length > 0);
        });
    });

    describe('browserTimezoneOffsetToSQLFormat', function() {
        it(`should return the timezone offset as '+09:00' provided a value in minutes as '-540'`, function() {
            assert.equal(Utility.browserTimezoneOffsetToSQLFormat('-540'), '+09:00');
        });

        it(`should return the timezone offset as '-03:30' provided a value in minutes as '210'`, function() {
            assert.equal(Utility.browserTimezoneOffsetToSQLFormat('210'), '-03:30');
        });

        it(`should return the timezone offset as '+00:00' provided a value in minutes as '0'`, function() {
            assert.equal(Utility.browserTimezoneOffsetToSQLFormat('0'), '+00:00');
        });

        it(`should return the timezone offset as '+08:45' provided a value in minutes as '-525'`, function() {
            assert.equal(Utility.browserTimezoneOffsetToSQLFormat('-525'), '+08:45');
        });

        it(`should return the timezone offset as '+00:00' if no value is provided`, function() {
            assert.equal(Utility.browserTimezoneOffsetToSQLFormat(null), '+00:00');
        });
    });

    describe('tomorrow', function() {
        it(`should return a javascript Date object`, function() {
            assert(Utility.tomorrow() instanceof Date);
        });

        it(`should return a Date object equal to 24 hours later than the current time`, function() {
            const tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
            const expected = Math.floor(tomorrow.getTime() / 10);
            const actual = Math.floor(Utility.tomorrow().getTime() / 10);
            assert.equal(actual, expected);
        });
    });

    describe('findMaxSizeForAspectInSize(aspect, size)', function() {
        it('should find the maximum dimensions for the given aspect ratio in the given container 1920×1080', function() {
            const maxSize = {
                width: 1920,
                height: 1080
            };

            const aspectRatio = {
                width: 3,
                height: 2
            };

            const expectedSize = {
                width: 1620,
                height: 1080
            };

            const actualSize = Utility.findMaxSizeForAspectInSize(aspectRatio, maxSize);

            assert.equal(expectedSize.width, actualSize.width);
            assert.equal(expectedSize.height, actualSize.height);
        });

        it('should find the maximum dimensions for the given aspect ratio in the given container 1080×720', function() {
            const maxSize = {
                width: 1080,
                height: 720
            };

            const aspectRatio = {
                width: 3,
                height: 2
            };

            const expectedSize = {
                width: 1080,
                height: 720
            };

            const actualSize = Utility.findMaxSizeForAspectInSize(aspectRatio, maxSize);

            assert.equal(expectedSize.width, actualSize.width);
            assert.equal(expectedSize.height, actualSize.height);
        });

        it('should find the maximum dimensions for the given aspect ratio in the given container 720×1080', function() {
            const maxSize = {
                width: 720,
                height: 1080
            };

            const aspectRatio = {
                width: 3,
                height: 2
            };

            const expectedSize = {
                width: 720,
                height: 480
            };

            const actualSize = Utility.findMaxSizeForAspectInSize(aspectRatio, maxSize);

            assert.equal(expectedSize.width, actualSize.width);
            assert.equal(expectedSize.height, actualSize.height);
        });
    });

    describe('_validateSizeObject', function() {
        it('should throw a ReferenceError if no argument is provided', function() {
            function test() {
                return Utility._validateSizeObject();
            }

            assert.throws(test, ReferenceError);
        });

        it('should throw a TypeError if the argument is not a plain object', function() {
            function test() {
                return Utility._validateSizeObject(_.stubString());
            }

            assert.throws(test, TypeError);
        });

        it('should throw a TypeError if the aspect argument has no "width" number property', function() {
            function test() {
                return Utility._validateSizeObject({height: 200});
            }

            assert.throws(test, TypeError);
        });

        it('should throw a TypeError if the aspect argument "width" number property values is less than 1', function() {
            function test() {
                return Utility._validateSizeObject({width: 0, height: 200});
            }

            assert.throws(test, TypeError);
        });

        it('should throw a TypeError if the aspect argument has no "height" number property', function() {
            function test() {
                return Utility._validateSizeObject({width: 300});
            }

            assert.throws(test, TypeError);
        });

        it('should throw a TypeError if the aspect argument "height" number property values is less than 1', function() {
            function test() {
                return Utility._validateSizeObject({width: 300, height: -5});
            }

            assert.throws(test, TypeError);
        });
    });

    describe('getHashForId', function() {
        it('should throw a ReferenceError if no arguments are provided', function() {
            function test() {
                Utility.getHashForId();
            }

            assert.throws(test, ReferenceError);
        });

        it('should throw a TypeError if the provided argument is not a number', function() {
            function test() {
                Utility.getHashForId({});
            }

            assert.throws(test, TypeError);
        });

        it('should return a string of length 11', function() {
            const hash = Utility.getHashForId(1);
            assert.equal(hash.length, 11);
        });
    });

    describe('getIdForHash', function() {
        it('should throw a ReferenceError if no arguments are provided', function() {
            function test() {
                Utility.getIdForHash();
            }

            assert.throws(test, ReferenceError);
        });

        it('should throw a TypeError if the provided argument is not a string', function() {
            function test() {
                Utility.getIdForHash(1);
            }

            assert.throws(test, TypeError);
        });

        it('should return a number matching the input for getHashForId', function() {
            const testValue = 1;
            const hash = Utility.getHashForId(testValue);
            const number = Utility.getIdForHash(hash);
            assert.equal(number, testValue);
        });
    });

    describe('pluckCurlyBraceEnclosedContent', function() {
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

        it(`should throw a ReferenceError if no text is specified`, function() {
            assert.throws(function() {
                Utility.pluckCurlyBraceEnclosedContent();
            }, ReferenceError);
        });

        it(`should throw a TypeError if the text argument is not a string`, function() {
            assert.throws(function() {
                Utility.pluckCurlyBraceEnclosedContent(_.stubObject());
            }, TypeError);
        });

        it(`should return an array`, function() {
            assert(_.isArray(Utility.pluckCurlyBraceEnclosedContent(english)));
        });

        it(`should create an array of 7 strings - English`, function() {
            assert.equal(Utility.pluckCurlyBraceEnclosedContent(english).length, 7);
        });

        it(`should create an array of 6 strings - Japanese`, function() {
            assert.equal(Utility.pluckCurlyBraceEnclosedContent(japanese).length, 6);
        });

        it(`should create an array of strings with the correct English contents`, function() {
            const expected = [
                'a number of',
                'first off',
                'since I was a little kid',
                'for a bit',
                'I have a passion for',
                'Other than that',
                'what I\'m into'
            ];

            assert.equal(_.difference(Utility.pluckCurlyBraceEnclosedContent(english), expected).length, 0);
        });

        it(`should create an array of strings with the correct Japanese contents`, function() {
            const expected = [
                '一週間半くらい',
                '空港まで迎えに来てくれた',
                '色々とお話ができた',
                'できなくなる危険性',
                '日本に引っ越した',
                '孤独になりやすい'
            ];

            assert.equal(_.difference(Utility.pluckCurlyBraceEnclosedContent(japanese), expected).length, 0);
        });

        it('should return an empty array if the text contains no curly braces', function() {
            assert.equal(Utility.pluckCurlyBraceEnclosedContent('This text contains no curly braces').length, 0);
        });
    });
});
