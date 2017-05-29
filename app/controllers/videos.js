/**
 * videos
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k               = require('../../config/keys.json');
const logger          = require('../../config/logger');
const services        = require('../services');
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError  = services['GetNativeError'];
const Speech          = services['Speech'];
const db              = require('../models');
const ModelHelper     = services['Model'](db);
const Subcategory     = db[k.Model.Subcategory];
const CuedVideo       = db[k.Model.CuedVideo];
const Language        = db[k.Model.Language];
const Speaker         = db[k.Model.Speaker];
const Video           = db[k.Model.Video];
const Like            = db[k.Model.Like];

const exec            = require('child_process').exec;
const Promise         = require('bluebird');
const formidable      = require('formidable');
const _               = require('lodash');

module.exports.index = (req, res, next) => {
    const conditions = {};

    return Language.findOne({where: {code: req.body.lang || 'en'}}).then(language => {
        conditions.language_id = language.get(k.Attr.Id);

        return Subcategory.findIdsForCategoryIdOrSubcategoryId(req.query);
    }).then(subcategoryIds => {
        if (subcategoryIds.length) {
            conditions.subcategory_id = {$in: subcategoryIds};
        }

        const createdAt  = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
        const cued       = Video.getCuedAttributeForUserId(req.user[k.Attr.Id]);
        const attributes = [createdAt, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length, cued];

        const scopes = [
            'newestFirst',
            {method: ['cuedAndMaxId', req.query.cued_only, req.user[k.Attr.Id], req.query.max_id]},
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
    const liked     = Video.isLikedByUser(db, req.params.id, req.user[k.Attr.Id]);
    const cued      = Video.isCuedByUser(db, req.params.id, req.user[k.Attr.Id]);

    const relatedCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
    const relatedCued      = Video.getCuedAttributeForUserId(req.user[k.Attr.Id]);

    const relatedVideos = Video.scope([
        {method: ['includeSubcategoryNameAndId', Subcategory]},
        {method: ['includeSpeakerName', Speaker]},
        {method: ['relatedToVideo', req.params.id]},
        'orderByRandom'
    ]).findAll({
        attributes: [k.Attr.Id, relatedCreatedAt, k.Attr.Length, k.Attr.PictureUrl, k.Attr.LoopCount, relatedCued],
        include: [{model: Language, attributes: [k.Attr.Name, k.Attr.Code], as: 'language'}],
        limit: 3
    }).catch(next);

    const video = Video.scope('includeTranscripts').findById(+req.params[k.Attr.Id], {
        include: [
            {model: Speaker, attributes: [k.Attr.Id, k.Attr.Description, k.Attr.Name, k.Attr.PictureUrl], as: 'speaker'},
            {model: Subcategory, attributes: [k.Attr.Id, k.Attr.Name], as: 'subcategory'},
            {model: Language, attributes: [k.Attr.Name, k.Attr.Code], as: 'language'}
        ],
        attributes: [k.Attr.Description, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length]
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
    return Video.findById(parseInt(req.params[k.Attr.Id])).then(video => {
        if (!video) {
            throw new GetNativeError(k.Error.ResourceNotFound);
        }

        return Like.create({
            video_id: video[k.Attr.Id],
            user_id: req.user[k.Attr.Id]
        });
    }).then(() => {
        res.sendStatus(204);
    }).catch(e => {
        res.status(404);
        next(e);
    });
};

module.exports.unlike = (req, res, next) => {
    return Video.findById(parseInt(req.params[k.Attr.Id])).then(video => {
        if (!video) {
            throw new GetNativeError(k.Error.ResourceNotFound);
        }

        return Like.destroy({
            where: {
                video_id: video[k.Attr.Id],
                user_id: req.user[k.Attr.Id]
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
        user_id: req.user[k.Attr.Id]
    }).then(() => {
        res.sendStatus(204);
    }).catch(next);
};

module.exports.dequeue = (req, res, next) => {
    return CuedVideo.destroy({
        where: {
            video_id: req.params.id,
            user_id: req.user[k.Attr.Id]
        },
        limit: 1
    }).then(() => {
        res.sendStatus(204);
    }).catch(next);
};

module.exports.transcribe = (req, res, next) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return next(err);
        }
        else if (_.size(files) === 0) {
            res.status(400);
            return next(new GetNativeError(k.Error.FileMissing));
        }

        const transcript = await Speech.transcribeVideo(files.file.path);

        res.status(200).send({
            transcription: transcript
        });
    });
};
