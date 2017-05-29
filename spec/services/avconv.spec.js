/**
 * avconv.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/29.
 */

const SpecUtil = require('../spec-util');
const avconv = require('../../app/services')['Avconv'];

const assert = require('assert');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

describe('avconv', function() {
    it('should throw a ReferenceError if no filename is provided', async function() {
        const asyncTest = avconv.videoToFlac.bind(null);
        assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
    });

    it('should throw a TypeError if the provided filename is not a string', async function() {
        const asyncTest = avconv.videoToFlac.bind(null, _.stubObject());
        assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
    });

    it('should return a Promise that resolves to a string filename', async function() {
        const file = path.resolve(__dirname, '..', 'fixtures', 'video.mov');
        const audioFilePath = await avconv.videoToFlac(file);
        assert(_.isString(audioFilePath));
    });

    it('should create a flac file', async function() {
        const file = path.resolve(__dirname, '..', 'fixtures', 'video.mov');
        const audioFilePath = await avconv.videoToFlac(file);
        assert(fs.existsSync(audioFilePath));
    });
});
