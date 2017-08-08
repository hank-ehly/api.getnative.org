/**
 * find-id-for-code
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/25.
 */

const k        = require('../../../config/keys.json');
const db       = require('../../../app/models');
const Language = db[k.Model.Language];
const SpecUtil = require('../../spec-util.js');

const assert   = require('assert');
const m = require('mocha');
const [describe, it, before] = [m.describe, m.it, m.before];
const _        = require('lodash');

describe('Language.findIdForCode', function() {
    let languages;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAllUndo();
        languages = await Language.bulkCreate([{name: 'English', code: 'en'}, {name: '日本語', code: 'ja'}]);
    });

    it('should return a promise that resolves into the correct id for the given language code', async function() {
        const languageId = await Language.findIdForCode('ja');
        assert.equal(languageId, _.find(languages, {code: 'ja'}).get(k.Attr.Id));
    });

    it('should throw a ReferenceError if no language code is provided', async function() {
        assert(await SpecUtil.throwsAsync(Language.findIdForCode, ReferenceError));
    });

    it('should throw a TypeError if the provided language code is not a string', async function() {
        assert(await SpecUtil.throwsAsync(Language.findIdForCode.bind(null, 5), TypeError));
    });
});
