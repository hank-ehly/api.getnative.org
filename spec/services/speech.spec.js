/**
 * speech.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/29.
 */

const SpecUtil = require('../spec-util');
const Speech = require('../../app/services')['Speech'];

const assert = require('assert');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const _ = require('lodash');
const path = require('path');

describe('Speech', function() {
    describe('transcribeVideo', function() {
        it('should throw a ReferenceError if no filepath argument is provided', async function() {
            const asyncTest = Speech.transcribeVideo.bind(null);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filepath is not a string', async function() {
            const asyncTest = Speech.transcribeVideo.bind(null, _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return a Promise that resolves to the transcribed text', async function() {
            const file = path.resolve(__dirname, '..', 'fixtures', 'video.mov');
            const transcript = await Speech.transcribeVideo(file);
            assert.equal(transcript, 'test-result');
        });

        it('should throw a TypeError if the provided languageCode argument is not a string', async function() {
            const file = path.resolve(__dirname, '..', 'fixtures', 'video.mov');
            const asyncTest = Speech.transcribeVideo.bind(null, file, _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a ReferenceError if no languageCode is provided', async function() {
            const file = path.resolve(__dirname, '..', 'fixtures', 'video.mov');
            const asyncTest = Speech.transcribeVideo.bind(null, file);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });
    });
});
