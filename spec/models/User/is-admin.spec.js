/**
 * is-admin.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/29.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const User = require('../../../app/models')[k.Model.User];

const assert = require('assert');
const mocha = require('mocha');
const it = mocha.it;
const describe = mocha.describe;
const before = mocha.before;

describe('User.prototype.isAdmin', function() {
    let adminUser, normalUser;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        await SpecUtil.seedAll();

        [adminUser, normalUser] = [
            await User.find({where: {email: SpecUtil.adminCredentials.email}}),
            await User.find({where: {email: SpecUtil.credentials.email}})
        ];
    });

    it('should return true if the user belongs to the admin role', async function() {
        assert.equal(true, await adminUser.isAdmin());
    });

    it('should return false if the user does not belong to the admin role', async function() {
        assert.equal(false, await normalUser.isAdmin());
    });
});
