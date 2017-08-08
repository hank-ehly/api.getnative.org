/**
 * storage.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/28.
 */

const SpecUtil = require('../spec-util');
const Storage = require('../../app/services')['Storage'];

const assert = require('assert');
const mocha = require('mocha');
const describe = mocha.describe;
const path = require('path');
const it = mocha.it;
const _ = require('lodash');

describe('Storage', function() {
    describe('upload', function() {
        it('should throw a ReferenceError if no filepath argument is provided', async function() {
            const asyncTest = Storage.upload.bind(null);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filepath is not a string', async function() {
            const asyncTest = Storage.upload.bind(null, _.stubObject(), 'test.mp4');
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a ReferenceError if no destination argument is provided', async function() {
            const asyncTest = Storage.upload.bind(null, 'test.mp4');
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided destination is not a string', async function() {
            const asyncTest = Storage.upload.bind(null, 'test.mp4', _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return a Promise that resolves to a File (or TestFile in this case) object', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const filepath = path.resolve(__dirname, '..', 'fixtures', '1080x720.mov');
            const destination = new Date().getTime().toString();
            const testFile = await Storage.upload(filepath, destination);
            assert.equal(testFile.name, 'TestFile');
        });
    });
});
