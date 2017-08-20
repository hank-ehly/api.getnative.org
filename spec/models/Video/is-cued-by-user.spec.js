/**
 * is-cued-by-user.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/26.
 */

const SpecUtil = require('../../spec-util');
const db = require('../../../app/models');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('Video.isCuedByUser', function() {
    let user = null;
    let server = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initGroup) {
            server = initGroup.server;
            user = initGroup.response.body;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    it('should return true if the video is cued by the user', async function() {
        const video = await db[k.Model.Video].find();
        await db[k.Model.CuedVideo].create({video_id: video.get(k.Attr.Id), user_id: user[k.Attr.Id]});
        const isQueued = await db[k.Model.Video].isCuedByUser(video.get(k.Attr.Id), user[k.Attr.Id]);
        assert(isQueued);
    });

    it('should return false if the video is not cued by the user', async function() {
        const video = await db[k.Model.Video].find();
        await db[k.Model.CuedVideo].destroy({
            where: {
                video_id: video.get(k.Attr.Id),
                user_id: user[k.Attr.Id]
            },
            force: true
        });
        const isQueued = await db[k.Model.Video].isCuedByUser(video.get(k.Attr.Id), user[k.Attr.Id]);
        assert(!isQueued);
    });
});
