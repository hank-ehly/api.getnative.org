/**
 * videos
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const services        = require('../services');
const ResponseWrapper = services.ResponseWrapper;
const db              = require('../models');
const ModelHelper     = services.Model(db);
const Subcategory     = db.Subcategory;
const CuedVideo       = db.CuedVideo;
const Speaker         = db.Speaker;
const Video           = db.Video;
const Like            = db.Like;
const k               = require('../../config/keys.json');

const Promise         = require('bluebird');

module.exports.index = (req, res, next) => {
    const conditions = {language_code: req.query.lang || 'en'};

    return Subcategory.findIdsForCategoryIdOrSubcategoryId(req.query).then(subcategoryIds => {
        if (subcategoryIds.length) {
            conditions.subcategory_id = {$in: subcategoryIds};
        }

        const createdAt  = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
        const cued       = Video.getCuedAttributeForAccountId(req.accountId);
        const attributes = [createdAt, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length, cued];

        const scopes = [
            'newestFirst',
            {method: ['cuedAndMaxId', req.query.cued_only, req.accountId, req.query.max_id]},
            {method: ['count', req.query.count]},
            {method: ['includeSubcategoryNameAndId', Subcategory]},
            {method: ['includeSpeakerName', Speaker]}
        ];

        return Video.scope(scopes).findAll({
            attributes: attributes,
            where: conditions
        });
    }).then(videos => {
        const videosAsJson = ResponseWrapper.wrap(videos.map(v => {
            v = v.get({plain: true});
            v.cued = v.cued === 1;
            return v;
        }));

        res.send(videosAsJson)
    }).catch(next);
};

module.exports.show = (req, res, next) => {
    const likeCount = Video.getLikeCount(db, req.params.id);
    const liked     = Video.isLikedByAccount(db, req.params.id, req.accountId);
    const cued      = Video.isCuedByAccount(db, req.params.id, req.accountId);

    const relatedCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
    const relatedCued      = Video.getCuedAttributeForAccountId(req.accountId);

    const relatedVideos = Video.scope([
        {method: ['includeSubcategoryNameAndId', Subcategory]},
        {method: ['includeSpeakerName', Speaker]},
        {method: ['relatedToVideo', req.params.id]},
        'orderByRandom'
    ]).findAll({
        attributes: [k.Attr.Id, relatedCreatedAt, k.Attr.Length, k.Attr.PictureUrl, k.Attr.LoopCount, relatedCued],
        limit: 3
    }).catch(next);

    const video = Video.scope('includeTranscripts').findById(+req.params.id, {
        include: [
            {model: Speaker, attributes: [k.Attr.Id, k.Attr.Description, k.Attr.Name, k.Attr.PictureUrl], as: 'speaker'},
            {model: Subcategory, attributes: [k.Attr.Id, k.Attr.Name], as: 'subcategory'}
        ],
        attributes: [k.Attr.Description, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length, k.Attr.LanguageCode]
    }).catch(next);

    return Promise.join(likeCount, liked, cued, relatedVideos, video, (likeCount, liked, cued, relatedVideos, video) => {
        video = video.get({plain: true});

        video.like_count = likeCount;
        video.liked      = liked;
        video.cued       = cued;

        video.related_videos = ResponseWrapper.wrap(relatedVideos.map(r => {
            r = r.get({plain: true});
            r.cued = r.cued === 1;
            return r;
        }));

        video.transcripts = ResponseWrapper.wrap(video.transcripts.map(t => {
            t.collocations = ResponseWrapper.deepWrap(t.collocations, ['usage_examples']);
            return t;
        }));

        res.send(video);
    }).catch(next);
};

module.exports.like = (req, res, next) => {
    return Video.findById(+req.params.id).then(video => {
        return Like.create({
            video_id: video.id,
            account_id: req.accountId
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(e => {
        res.status(404);
        next(e);
    });
};

module.exports.unlike = (req, res, next) => {
    return Video.findById(+req.params.id).then(video => {
        return Like.destroy({
            where: {
                video_id: video.id,
                account_id: req.accountId
            },
            limit: 1
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(e => {
        res.status(404);
        next(e);
    });
};

module.exports.queue = (req, res, next) => {
    return CuedVideo.create({
        video_id: req.params.id,
        account_id: req.accountId
    }).then(() => {
        res.sendStatus(204);
    }).catch(next);
};

module.exports.dequeue = (req, res, next) => {
    return CuedVideo.destroy({
        where: {
            video_id: req.params.id,
            account_id: req.accountId
        },
        limit: 1
    }).then(() => {
        res.sendStatus(204);
    }).catch(next);
};
