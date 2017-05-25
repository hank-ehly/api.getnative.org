/**
 * find-id-for-code
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/25.
 */

const k        = require('../../../config/keys.json');
const db       = require('../../../app/models');
const Language = db[k.Model.Language];
const SpecUtil = require('../../spec-util.js');

const assert   = require('assert');
const mocha    = require('mocha');
const describe = mocha.describe;
const it       = mocha.it;
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

    // it('should throw a ReferenceError if no language code is provided', function() {
    //     assert.throws(function() {
    //        Language.findIdForCode();
    //     }, ReferenceError);
    // });
    //
    // it('should throw a TypeError if the provided language code is not a string', function() {
    //     assert.throws(async function() {
    //         await Language.findIdForCode(5);
    //     }, TypeError);
    // });
});
