/**
 * verification-token
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/18.
 */

const db = require('../../app/models');
const k = require('../../config/keys.json');
const User = db[k.Model.User];
const VerificationToken = db[k.Model.VerificationToken];
const Language = db[k.Model.Language];
const Auth = require('../../app/services')['Auth'];
const SpecUtil = require('../spec-util');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const chance = require('chance').Chance();
const assert = require('assert');
const moment = require('moment');

describe('VerificationToken', function() {
    let user = null;

    before(function() {
        return Language.bulkCreate([
            {
                name: 'English',
                code: 'en'
            },
            {
                name: '日本語',
                code: 'ja'
            }
        ]);
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);

        return Language.find().then(function(language) {
            return User.create({
                default_study_language_id: language.get(k.Attr.Id),
                interface_language_id: language.get(k.Attr.Id),
                email: chance.email()
            });
        }).then(function(_user) {
            user = _user.get({plain: true});
        });
    });

    describe('isExpired', function() {
        it(`should return true if the tokens' expiration_date is less than the current date`, function() {
            return VerificationToken.create({
                user_id: user[k.Attr.Id],
                token: Auth.generateRandomHash(),
                expiration_date: moment().subtract(1, 'days').toDate()
            }).then(function(token) {
                assert(token.isExpired());
            });
        });

        it(`should return false if the tokens' expiration_date is greater than the current date`, function() {
            return VerificationToken.create({
                user_id: user[k.Attr.Id],
                token: Auth.generateRandomHash(),
                expiration_date: moment().add(1, 'days').toDate()
            }).then(function(token) {
                assert(!token.isExpired());
            });
        });
    });
});
