/**
 * video
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/16.
 */

const SpecUtil = require('../../spec-util');
const db       = require('../../../app/models');
const k        = require('../../../config/keys.json');
const Video    = db[k.Model.Video];

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const assert   = require('assert');
const _        = require('lodash');

describe('Video', function() {
    let user = null;
    let server = null;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.login().then(function(initGroup) {
            server  = initGroup.server;
            user = initGroup.response.body;
        });
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('cuedAndMaxId', function() {
        it(`should only return cued videos whose ids are less than the max id`, function() {
            return Video.findAll({attributes: ['id']}).then(function(videos) {
                const midVideoId = videos[Math.floor(videos.length / 2)].id;
                const cued = Video.getCuedAttributeForUserId(user.id);
                return Video.scope({method: ['cuedAndMaxId', true, user.id, midVideoId]}).findAll({attributes: {include: [cued]}})
                    .then(function(videos) {
                        _.each(videos, function(video) {
                            assert(_.lt(video.get('id'), midVideoId));
                            assert.equal(video.get('cued'), true);
                        });
                    });
            });
        });

        it(`should return videos whose ids are less than the max id`, function() {
            return Video.findAll({attributes: ['id']}).then(function(videos) {
                const midVideoId = videos[Math.floor(videos.length / 2)].id;
                const cued = Video.getCuedAttributeForUserId(user.id);
                return Video.scope({method: ['cuedAndMaxId', false, user.id, midVideoId]}).findAll({attributes: {include: [cued]}})
                    .then(function(videos) {
                        assert(_.lt(_.first(videos).id, midVideoId));
                    });
            });
        });

        it(`should return videos`, function() {
            const cued = Video.getCuedAttributeForUserId(user.id);
            return Video.scope({method: ['cuedAndMaxId', false, user.id]}).findAll({attributes: {include: [cued]}})
                .then(function(videos) {
                    assert(_.gt(videos.length, 0));
                });
        });

        it(`should only return cued videos`, function() {
            const cued = Video.getCuedAttributeForUserId(user.id);
            return Video.scope({method: ['cuedAndMaxId', true, user.id]}).findAll({attributes: {include: [cued]}})
                .then(function(videos) {
                    _.each(videos, function(video) {
                        assert.equal(video.get('cued'), true);
                    });
                });
        });
    });

    describe('relatedToVideo', function() {
        it(`should return videos who belong to the same category as the specified video`, function() {
            return Video.find().then(function(video) {
                const expectedSubcategoryIds = db.sequelize.query(`
                    SELECT id FROM subcategories WHERE category_id IN (
                        SELECT category_id FROM subcategories WHERE id = (
                            SELECT subcategory_id FROM videos WHERE id = ?
                        )
                    )
                `, {replacements: [video.get(k.Attr.Id)]}).then(function(values) {
                    const [results] = values;
                    return _.map(results, k.Attr.Id);
                });

                const actualSubcategoryIds = Video.scope({method: ['relatedToVideo', video.get(k.Attr.Id)]}).findAll().then(function(videos) {
                    return _.map(videos, 'subcategory_id');
                });

                return Promise.all([expectedSubcategoryIds, actualSubcategoryIds]).then(function(values) {
                    const [expected, actual] = values;
                    assert.equal(_.difference(actual, expected).length, 0);
                });
            });
        });

        it('should not return the same video as the target video', async function() {
            const video = await Video.find();
            const targetVideoId = video.get(k.Attr.Id);
            const relatedVideos = await Video.scope({method: ['relatedToVideo', targetVideoId]}).findAll();
            const relatedVideoIdx = _.map(relatedVideos, v => v.get(k.Attr.Id));
            assert(!_.includes(relatedVideoIdx, relatedVideos));
        });
    });

    describe('orderByRandom', function() {
        it(`should return different results for the same query`, function() {
            const q1 = Video.scope('orderByRandom').findAll({limit: 5});
            const q2 = Video.scope('orderByRandom').findAll({limit: 5});
            return Promise.all([q1, q2]).then(function(values) {
                const [first, second] = values;
                assert(!_.isEqual(first, second));
            });
        });
    });
});
