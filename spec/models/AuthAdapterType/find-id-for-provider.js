/**
 * find-id-for-provider
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/26.
 */

const k               = require('../../../config/keys.json');
const db              = require('../../../app/models');
const AuthAdapterType = db[k.Model.AuthAdapterType];
const SpecUtil        = require('../../spec-util.js');

const assert          = require('assert');
const m = require('mocha');
const [describe, it, before] = [m.describe, m.it, m.before];
const _               = require('lodash');

describe('AuthAdapterType.findIdForProvider', function() {
    let authAdapterTypes;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAllUndo();
        authAdapterTypes = await AuthAdapterType.bulkCreate([{name: 'facebook'}, {name: 'twitter'}, {name: 'local'}]);
    });

    it('should return a promise that resolves into the correct id for the given provider name', async function() {
        const authAdapterTypeId = await AuthAdapterType.findIdForProvider('twitter');
        assert.equal(authAdapterTypeId, _.find(authAdapterTypes, {name: 'twitter'}).get(k.Attr.Id));
    });

    it('should throw a ReferenceError if no language code is provided', async function() {
        assert(await SpecUtil.throwsAsync(AuthAdapterType.findIdForProvider, ReferenceError));
    });

    it('should throw a TypeError if the provided language code is not a string', async function() {
        assert(await SpecUtil.throwsAsync(AuthAdapterType.findIdForProvider.bind(null, 5), TypeError));
    });
});
