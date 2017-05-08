/**
 * auth.spec
 * get-native.com
 *
 * Created by henryehly on 2017/03/27.
 */

const services    = require('../../app/services');
const Auth = services.Auth;
const Utility    = services.Utility;
const SpecUtil   = require('../spec-util');
const config     = require('../../config');
const k          = require('../../config/keys.json');

const assert     = require('assert');
const _          = require('lodash');

describe('Auth', function() {
    describe('refreshToken', function() {
        it(`should throw a ReferenceError if the 'token' parameter is missing`, function() {
            assert.throws(function() {
                Auth.refreshToken();
            }, ReferenceError);
        });

        it(`should throw a TypeError if the 'token' parameter is not a plain object`, function() {
            assert.throws(function() {
                Auth.refreshToken(['not', 'a', 'plain', 'object']);
            }, TypeError);
        });
    });

    describe('hashPassword', function() {
        it(`should throw a ReferenceError if there is no input`, function() {
            assert.throws(() => Auth.hashPassword(), ReferenceError);
        });

        it(`should throw a TypeError if the input is not a string`, function() {
            assert.throws(() => Auth.hashPassword({}), TypeError);
            assert.throws(() => Auth.hashPassword(123), TypeError);
            assert.throws(() => Auth.hashPassword(true), TypeError);
            assert.throws(() => Auth.hashPassword([]), TypeError);
        });

        it(`should generate a hash not equal to the password`, function() {
            assert.notEqual(Auth.hashPassword('password'), 'password');
        });

        it(`should return a string`, function() {
            assert(_.isString(Auth.hashPassword('password')));
        });
    });

    describe('verifyPassword', function() {
        it(`should throw a ReferenceError if there are less than 2 arguments`, function() {
            assert.throws(() => Auth.verifyPassword('password'), ReferenceError);
        });

        it(`should throw a TypeError if either one of the input arguments are not a string`, function() {
            assert.throws(() => Auth.verifyPassword({}, 'password'), TypeError);
            assert.throws(() => Auth.verifyPassword('password', 123), TypeError);
            assert.throws(() => Auth.verifyPassword(true, 'password'), TypeError);
            assert.throws(() => Auth.verifyPassword('password', []), TypeError);
        });

        it(`should return false if a library-specify error occurs`, function() {
            assert.equal(Auth.verifyPassword('password', 'password'), false);
        });

        it(`should return true if the password is a match`, function() {
            let hash = Auth.hashPassword('password');
            assert(Auth.verifyPassword(hash, 'password'));
        });

        it(`should return false if the password is not a match`, function() {
            let hash = Auth.hashPassword('password');
            assert(!Auth.verifyPassword(hash, '_password'));
        });
    });

    describe('generateVerificationToken', function() {
        it(`should return a string`, function() {
            assert(_.isString(Auth.generateVerificationToken()));
        });

        it(`should return a string that is 32 characters in length`, function() {
            assert.equal(Auth.generateVerificationToken().length, 32);
        });

        it(`should generate unique tokens`, function() {
            assert.notEqual(Auth.generateVerificationToken(), Auth.generateVerificationToken());
        });
    });

    describe('generateConfirmationURLForToken', function() {
        it(`should throw a ReferenceError if no verification token is provided`, function() {
            assert.throws(function() {
                Auth.generateConfirmationURLForToken();
            }, ReferenceError);
        });

        it(`should throw a TypeError if the provided verification token is not a string`, function() {
            assert.throws(function() {
                Auth.generateConfirmationURLForToken({not: ['a', 'string']});
            }, TypeError);
        });

        it(`should return a valid URL string`, function() {
            const token = Auth.generateVerificationToken();
            const url = Auth.generateConfirmationURLForToken(token);
            assert(SpecUtil.isValidURL(url));
        });

        it(`should return a string containing the verification token`, function() {
            const token = Auth.generateVerificationToken();
            const url = Auth.generateConfirmationURLForToken(token);
            assert(_.includes(url, token));
        });

        it(`should return a url with the correct scheme, hostname, pathname and query`, function() {
            const token  = Auth.generateVerificationToken();
            const actual = Auth.generateConfirmationURLForToken(token);

            const expected = `${config.get(k.Client.Protocol)}://${config.get(k.Client.Host)}/confirm_email?token=${token}`;

            assert.equal(actual, expected);
        });
    });
});
