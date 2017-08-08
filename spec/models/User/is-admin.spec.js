/**
 * is-admin.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/29.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const assert = require('assert');
const m = require('mocha');
const [describe, it, before, after] = [m.describe, m.it, m.before, m.after];

describe('User.prototype.isAdmin', function() {
    let adminUser, normalUser, result;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
        result = await SpecUtil.login();
        adminUser = await result.db[k.Model.User].find({where: {email: SpecUtil.adminCredentials.email}});
        normalUser = await result.db[k.Model.User].find({where: {email: SpecUtil.credentials.email}});
    });

    after(function(done) {
        result.server.close(done);
    });

    it('should return true if the user belongs to the admin role', async function() {
        assert.equal(true, await adminUser.isAdmin());
    });

    it('should return false if the user does not belong to the admin role', async function() {
        assert.equal(false, await normalUser.isAdmin());
    });
});
