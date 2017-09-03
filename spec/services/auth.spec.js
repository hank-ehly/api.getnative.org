/**
 * auth.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/27.
 */

const Auth = require('../../app/services/auth');
const Utility = require('../../app/services/utility');
const SpecUtil = require('../spec-util');
const config = require('../../config/application').config;
const k = require('../../config/keys.json');
const db = require('../../app/models');

const m = require('mocha');
const [describe, it] = [m.describe, m.it];
const assert = require('assert');
const _ = require('lodash');
const url = require('url');
const jwt = require('jsonwebtoken');

describe('Auth', function() {
    describe('refreshDecodedToken', function() {
        it(`should throw a ReferenceError if the 'token' parameter is missing`, function() {
            function test() {
                Auth.refreshDecodedToken();
            }

            assert.throws(test, ReferenceError);
        });

        it(`should throw a TypeError if the 'token' parameter is not a plain object`, function() {
            function test() {
                Auth.refreshDecodedToken(2);
            }

            assert.throws(test, TypeError);
        });

        it ('should refresh the decoded token', async function() {
            const user = await db[k.Model.User].find();
            const token = await Auth.generateTokenForUserId(user.get(k.Attr.Id));
            const decodedToken = await Auth.verifyToken(token);
            const refreshedToken = await Auth.refreshDecodedToken(decodedToken);
            assert.equal(jwt.decode(token).issuer, jwt.decode(refreshedToken).issuer);
        })
    });

    describe('hashPassword', function() {
        it(`should throw a ReferenceError if there is no input`, function() {
            function test() {
                return Auth.hashPassword();
            }

            assert.throws(test, ReferenceError);
        });

        it(`should throw a TypeError if the input is not a string`, function() {
            function test() {
                return Auth.hashPassword(_.stubObject());
            }

            assert.throws(test, TypeError);
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
            function test() {
                return Auth.verifyPassword('password');
            }

            assert.throws(test, ReferenceError);
        });

        it(`should throw a TypeError if either one of the input arguments are not a string`, function() {
            function test() {
                return Auth.verifyPassword(_.stubObject(), 'password');
            }

            assert.throws(test, TypeError);
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

    describe('generateRandomHash', function() {
        it(`should return a string`, function() {
            assert(_.isString(Auth.generateRandomHash()));
        });

        it(`should return a string that is 32 characters in length`, function() {
            assert.equal(Auth.generateRandomHash().length, 32);
        });

        it(`should generate unique tokens`, function() {
            assert.notEqual(Auth.generateRandomHash(), Auth.generateRandomHash());
        });
    });

    describe('generateConfirmationURLForTokenWithPath', function() {
        it(`should throw a ReferenceError if no verification token is provided`, function() {
            function test() {
                Auth.generateConfirmationURLForTokenWithPath(null, 'pathname');
            }

            assert.throws(test, ReferenceError);
        });

        it(`should throw a ReferenceError if no pathname is provided`, function() {
            const token = Auth.generateRandomHash();

            function test() {
                Auth.generateConfirmationURLForTokenWithPath(token);
            }

            assert.throws(test, ReferenceError);
        });

        it(`should throw a TypeError if the provided verification token is not a string`, function() {
            function test() {
                Auth.generateConfirmationURLForTokenWithPath({not: ['a', 'string']}, 'pathname');
            }

            assert.throws(test, TypeError);
        });

        it(`should throw a TypeError if the provided pathname is not a string`, function() {
            const token = Auth.generateRandomHash();

            function test() {
                Auth.generateConfirmationURLForTokenWithPath(token, {not: ['a', 'string']});
            }

            assert.throws(test, TypeError);
        });

        it(`should return a valid URL string`, function() {
            const token = Auth.generateRandomHash();
            const response = Auth.generateConfirmationURLForTokenWithPath(token, 'test');
            assert(SpecUtil.isValidURL(response));
        });

        it(`should return a string containing the verification token`, function() {
            const token = Auth.generateRandomHash();
            const response = Auth.generateConfirmationURLForTokenWithPath(token, 'test');
            assert(_.includes(response, token));
        });

        it(`should return a string containing the correct pathname`, function() {
            const token = Auth.generateRandomHash();
            const response = Auth.generateConfirmationURLForTokenWithPath(token, 'test');
            const parsedUrl = url.parse(response);
            assert.equal(parsedUrl.pathname, '/test');
        });

        it(`should return a url with the correct scheme, hostname, pathname and query`, function() {
            const token = Auth.generateRandomHash();
            const actual = Auth.generateConfirmationURLForTokenWithPath(token, 'test');
            const expected = `${config.get(k.Client.Protocol)}://${config.get(k.Client.Host)}/test?token=${token}`;
            assert.equal(actual, expected);
        });
    });
});
