/**
 * verification-token
 * get-native.com
 *
 * Created by henryehly on 2017/04/18.
 */

const db                = require('../../app/models');
const Account           = db.Account;
const VerificationToken = db.VerificationToken;
const Auth              = require('../../app/services').Auth;
const SpecUtil          = require('../spec-util');

const Promise = require('bluebird');
const assert  = require('assert');
const moment  = require('moment');
const crypto  = require('crypto');

describe('VerificationToken', function() {
    let account = null;

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return Account.create({
            email: 'test-' + crypto.randomBytes(8).toString('hex') + '@email.com',
            password: Auth.hashPassword('12345678')
        }).then(function(_) {
            account = _;
        });
    });

    describe('isExpired', function() {
        it(`should return true if the tokens' expiration_date is less than the current date`, function() {
            return VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().subtract(1, 'days').toDate()
            }).then(function(token) {
                assert(token.isExpired());
            });
        });

        it(`should return false if the tokens' expiration_date is greater than the current date`, function() {
            return VerificationToken.create({
                account_id: account.id,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                assert(!token.isExpired());
            });
        });
    });
});
