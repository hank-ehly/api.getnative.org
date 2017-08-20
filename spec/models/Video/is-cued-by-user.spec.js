/**
 * is-cued-by-user.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/26.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert = require('assert');
const _ = require('lodash');

describe('Video.isCuedByUser', function() {
    let user, server, video, db;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login();
        server = results.server;
        user = results.response.body;
        db = results.db;
        video = await db[k.Model.Video].find();
        await db[k.Model.CuedVideo].destroy({
            where: {
                video_id: video.get(k.Attr.Id),
                user_id: user[k.Attr.Id]
            },
            force: true
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    it('should return true if the video is cued by the user', async function() {
        await db[k.Model.CuedVideo].create({
            video_id: video.get(k.Attr.Id),
            user_id: user[k.Attr.Id]
        });
        const isQueued = await db[k.Model.Video].isCuedByUser(video.get(k.Attr.Id), user[k.Attr.Id]);
        assert(isQueued);
    });

    it('should return false if the video is not cued by the user', async function() {
        const isQueued = await db[k.Model.Video].isCuedByUser(video.get(k.Attr.Id), user[k.Attr.Id]);
        assert(!isQueued);
    });
});
