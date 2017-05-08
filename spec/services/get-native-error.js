/**
 * get-native-error.spec
 * get-native.com
 *
 * Created by henryehly on 2017/04/02.
 */

const GetNativeError = require('../../app/services').GetNativeError;
const k              = require('../../config/keys.json');

const assert         = require('assert');
const _              = require('lodash');

describe('GetNativeError', function() {
    before(function() {
        require('../../config/i18n');
    });

    it(`should return an object with a 'message' string property`, function() {
        assert(_.isString(new GetNativeError(k.Error.TokenExpired).message));
    });

    it(`should not have an empty message`, function() {
        assert.notEqual(new GetNativeError(k.Error.TokenExpired).message, '');
    });

    it(`should throw a ReferenceError if no code is provided`, function() {
        assert.throws(function() {
            new GetNativeError()
        }, ReferenceError);
    });

    it(`should throw a TypeError if the code is not a string`, function() {
        assert.throws(function() {
            new GetNativeError(100)
        }, TypeError);
    });

    it(`should not throw a ReferenceError if the code is unknown`, function() {
        assert.doesNotThrow(function() {
            new GetNativeError('unknown code')
        }, ReferenceError);
    });

    it(`should override the default message if a second optional message argument is provided`, function() {
        const overrideMessage = 'override';
        const error = new GetNativeError(k.Error.TokenExpired, overrideMessage);
        assert.equal(error.message, overrideMessage);
    });

    it(`should throw a TypeError of the default message is not a string`, function() {
        assert.throws(function() {
            new GetNativeError(k.Error.TokenExpired, {})
        }, TypeError);
    });
});
