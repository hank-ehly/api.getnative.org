/**
 * mailchimp-subscriber-hash
 * api.getnative.org
 *
 * Created by henryehly on 2018/03/13.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Utility = require('../../../app/services/utility');
const db = require('../../../app/models');
const Credential = db[k.Model.Credential];
const User = db[k.Model.User];
const Language = db[k.Model.Language];

const chance = require('chance').Chance();
const assert = require('assert');
const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];

describe('User.mailChimpSubscriberHash', function() {
    let user = null;
    let testEmailAddress = '73121ae6d4717d39264587aa270d046e@eXaMple.cOm';

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const language = await Language.find();

        user = await User.create({
            default_study_language_id: language.get(k.Attr.Id),
            interface_language_id: language.get(k.Attr.Id),
            email: testEmailAddress
        });

        await Credential.create({user_id: user.get(k.Attr.Id)});
    });

    describe('mailChimpSubscriberHash', function() {
        it('should return the MD5 hash of the lowercase version of the user email address', function() {
            assert.equal(user.mailChimpSubscriberHash(), Utility.md5(testEmailAddress.toLowerCase()))
        });
    });
});
