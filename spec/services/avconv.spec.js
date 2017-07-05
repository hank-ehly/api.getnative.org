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
    const videoPath = path.resolve(__dirname, '..', 'fixtures', '1080x720.mov');
    const actualDimensions = {
        width: 1080,
        height: 720
    };

    describe('videoToFlac', function() {
        it('should throw a ReferenceError if no filename is provided', async function() {
            const asyncTest = avconv.videoToFlac.bind(null);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filename is not a string', async function() {
            const asyncTest = avconv.videoToFlac.bind(null, _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return a Promise that resolves to a string filename', async function() {
            const audioFilePath = await avconv.videoToFlac(videoPath);
            assert(_.isString(audioFilePath));
        });

        it('should create a flac file', async function() {
            const audioFilePath = await avconv.videoToFlac(videoPath);
            assert(fs.existsSync(audioFilePath));
        });
    });

    describe('getDimensionsOfVisualMediaAtPath', function() {
        it('should throw a ReferenceError if no filename is provided', async function() {
            const asyncTest = avconv.getDimensionsOfVisualMediaAtPath.bind(null);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filename is not a string', async function() {
            const asyncTest = avconv.getDimensionsOfVisualMediaAtPath.bind(null, _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return a plain object', async function() {
            const dimensions = await avconv.getDimensionsOfVisualMediaAtPath(videoPath);
            assert(_.isPlainObject(dimensions));
        });

        it('should contain a top level "width" number', async function() {
            const dimensions = await avconv.getDimensionsOfVisualMediaAtPath(videoPath);
            assert(_.isNumber(dimensions.width));
        });

        it('should contain a top level "height" number', async function() {
            const dimensions = await avconv.getDimensionsOfVisualMediaAtPath(videoPath);
            assert(_.isNumber(dimensions.height));
        });

        it('should identify the correct width of the video', async function() {
            const expectedDimensions = await avconv.getDimensionsOfVisualMediaAtPath(videoPath);
            assert.equal(expectedDimensions.width, actualDimensions.width);
        });

        it('should identify the correct height of the video', async function() {
            const expectedDimensions = await avconv.getDimensionsOfVisualMediaAtPath(videoPath);
            assert.equal(expectedDimensions.height, actualDimensions.height);
        });
    });

    describe('cropVideoToSize', function() {
        it('should throw a ReferenceError if no filename is provided', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, null, {
                width: 300,
                height: 200
            });

            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filename is not a string', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, _.stubObject(), {
                width: 300,
                height: 200
            });

            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a ReferenceError if the expected size is blank', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, videoPath);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the expected size does not have a "width" number', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, videoPath, {height: 200});
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a TypeError if the expected size does not have a "height" number', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, videoPath, {width: 300});
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a TypeError if the expected size "width" is less than 1', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, videoPath, {
                width: -5,
                height: 200
            });

            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should throw a TypeError if the expected size "height" is less than 1', async function() {
            const asyncTest = await avconv.cropVideoToSize.bind(null, videoPath, {
                width: 300,
                height: 0
            });

            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return the filepath of the cropped video', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const croppedVideoPath = await avconv.cropVideoToSize(videoPath, {
                width: 500,
                height: 350
            });

            assert(_.isString(croppedVideoPath));
        });

        it('should resize a video to the specified dimensions', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const expectedSize = {
                width: 500,
                height: 350
            };

            const croppedVideoPath = await avconv.cropVideoToSize(videoPath, expectedSize);
            const actualSize = await avconv.getDimensionsOfVisualMediaAtPath(croppedVideoPath);

            assert(_.isEqual(actualSize, expectedSize));
        });
    });

    describe('captureFirstFrameOfVideo', function() {
        it('should throw a ReferenceError if no filename is provided', async function() {
            const asyncTest = avconv.captureFirstFrameOfVideo.bind(null);
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a TypeError if the provided filename is not a string', async function() {
            const asyncTest = avconv.captureFirstFrameOfVideo.bind(null, _.stubObject());
            assert(await SpecUtil.throwsAsync(asyncTest, TypeError));
        });

        it('should return the video frame filepath', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const outputFilepath = await avconv.captureFirstFrameOfVideo(videoPath);
            assert(_.isString(outputFilepath));
        });

        it('should generate an image with the same dimensions as the input video', async function() {
            this.timeout(SpecUtil.defaultTimeout);
            const imageFilepath = await avconv.captureFirstFrameOfVideo(videoPath);
            const imageDimensions = await avconv.getDimensionsOfVisualMediaAtPath(imageFilepath);
            assert(_.isEqual(imageDimensions, actualDimensions));
        });
    });
});
