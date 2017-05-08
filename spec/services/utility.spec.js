/**
 * utility.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/14.
 */

const Utility = require('../../app/services').Utility;

const assert  = require('assert');
const _       = require('lodash');

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
            let tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
            assert.equal(Utility.tomorrow().getTime(), tomorrow.getTime());
        });
    });
});
