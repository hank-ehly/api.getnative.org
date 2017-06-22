/**
 * videos
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../../config/keys.json');
const logger = require('../../config/logger');
const services = require('../services');
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError = services['GetNativeError'];
const Speech = services['Speech'];
const db = require('../models');
const ModelHelper = services['Model'](db);
const Subcategory = db[k.Model.Subcategory];
const SubcategoryLocalized = db[k.Model.SubcategoryLocalized];
const CuedVideo = db[k.Model.CuedVideo];
const Language = db[k.Model.Language];
const Speaker = db[k.Model.Speaker];
const SpeakerLocalized = db[k.Model.SpeakerLocalized];
const Transcript = db[k.Model.Transcript];
const Collocation = db[k.Model.Collocation];
const UsageExample = db[k.Model.UsageExample];
const Video = db[k.Model.Video];
const Like = db[k.Model.Like];

const exec = require('child_process').exec;
const formidable = require('formidable');
const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let videos, conditions = {};

    const interfaceLanguageCode = _.defaultTo(req.query.interface_lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code));
    const interfaceLanguageId = await Language.findIdForCode(interfaceLanguageCode);

    conditions.language_id = await Language.findIdForCode(_.defaultTo(req.body.lang, 'en'));

    const subcategoryIds = await Subcategory.findIdsForCategoryIdOrSubcategoryId(req.query);

    if (subcategoryIds.length) {
        conditions.subcategory_id = {$in: subcategoryIds};
    }

    const createdAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
    const cued = Video.getCuedAttributeForUserId(req.user[k.Attr.Id]);
    const attributes = [createdAt, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length, cued];

    const scopes = [
        'newestFirst',
        {method: ['cuedAndMaxId', req.query.cued_only, req.user[k.Attr.Id], req.query.max_id]},
        {method: ['count', req.query.count]}
    ];

    const include = [
        {
            model: Speaker,
            as: 'speaker',
            attributes: [k.Attr.Id],
            include: {
                model: SpeakerLocalized,
                as: 'speakers_localized',
                attributes: [k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }, {
            model: Subcategory,
            as: 'subcategory',
            attributes: [k.Attr.Id],
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }
    ];

    try {
        videos = await Video.scope(scopes).findAll({attributes: attributes, where: conditions, include: include});
    } catch (e) {
        return next(e);
    }

    if (_.size(videos) === 0) {
        return res.send({records: [], count: 0});
    }

    videos = _.invokeMap(videos, 'get', {
        plain: true
    });

    videos = ResponseWrapper.wrap(videos.map(video => {
        video.cued = video.cued === 1;

        video.speaker[k.Attr.Name] = _.first(video.speaker.speakers_localized)[k.Attr.Name];
        delete video.speaker.speakers_localized;

        video.subcategory[k.Attr.Name] = _.first(video.subcategory.subcategories_localized)[k.Attr.Name];
        delete video.subcategory.subcategories_localized;

        return video;
    }));

    return res.send(videos)
};

module.exports.show = async (req, res, next) => {
    let video, relatedVideos;

    const interfaceLanguageId = await Language.findIdForCode(
        _.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code))
    );

    const relatedInclude = [
        {
            model: Speaker,
            as: 'speaker',
            attributes: [k.Attr.Id],
            include: {
                model: SpeakerLocalized,
                as: 'speakers_localized',
                attributes: [k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }, {
            model: Subcategory,
            as: 'subcategory',
            attributes: [k.Attr.Id],
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }
    ];

    const videoInclude = [
        {
            model: Speaker,
            attributes: [k.Attr.Id, k.Attr.PictureUrl],
            as: 'speaker',
            include: {
                model: SpeakerLocalized,
                as: 'speakers_localized',
                attributes: [k.Attr.Description, k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }, {
            model: Subcategory,
            attributes: [k.Attr.Id],
            as: 'subcategory',
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Name],
                where: {language_id: interfaceLanguageId}
            }
        }, {
            model: Language,
            attributes: [k.Attr.Name, k.Attr.Code],
            as: 'language'
        }, {
            model: Transcript,
            attributes: [k.Attr.Id, k.Attr.Text],
            as: 'transcripts',
            include: [
                {
                    model: Collocation,
                    attributes: [k.Attr.Text, k.Attr.IPASpelling],
                    as: 'collocations',
                    include: {
                        model: UsageExample,
                        attributes: [k.Attr.Text],
                        as: 'usage_examples'
                    }
                }, {
                    model: Language,
                    attributes: [k.Attr.Name, k.Attr.Code],
                    as: 'language'
                }
            ]
        }
    ];

    const relatedCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset);
    const relatedCued = Video.getCuedAttributeForUserId(req.user[k.Attr.Id]);

    try {
        relatedVideos = await Video.scope([{method: ['relatedToVideo', +req.params[k.Attr.Id]]}, 'orderByRandom']).findAll({
            attributes: [k.Attr.Id, relatedCreatedAt, k.Attr.Length, k.Attr.PictureUrl, k.Attr.LoopCount, relatedCued],
            include: relatedInclude,
            limit: 3
        });

        video = await Video.findByPrimary(+req.params[k.Attr.Id], {
            attributes: [k.Attr.Description, k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length],
            include: videoInclude
        });
    } catch (e) {
        return next(e);
    }

    if (!video) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    video = video.get({
        plain: true
    });

    try {
        video.like_count = await Video.getLikeCount(db, req.params.id);
        video.liked = await Video.isLikedByUser(db, req.params.id, req.user[k.Attr.Id]);
        video.cued = await Video.isCuedByUser(db, req.params.id, req.user[k.Attr.Id]);
    } catch (e) {
        return next(e);
    }

    video.speaker[k.Attr.Name] = _.first(video.speaker.speakers_localized)[k.Attr.Name];
    video.speaker[k.Attr.Description] = _.first(video.speaker.speakers_localized)[k.Attr.Description];
    delete video.speaker.speakers_localized;

    video.subcategory[k.Attr.Name] = _.first(video.subcategory.subcategories_localized)[k.Attr.Name];
    delete video.subcategory.subcategories_localized;

    video.related_videos = _.invokeMap(relatedVideos, 'get', {
        plain: true
    });

    video.related_videos = ResponseWrapper.wrap(video.related_videos.map(relatedVideo => {
        relatedVideo.cued = relatedVideo.cued === 1;

        relatedVideo.speaker[k.Attr.Name] = _.first(relatedVideo.speaker.speakers_localized)[k.Attr.Name];
        delete relatedVideo.speaker.speakers_localized;
        delete relatedVideo.speaker[k.Attr.Id];

        relatedVideo.subcategory[k.Attr.Name] = _.first(relatedVideo.subcategory.subcategories_localized)[k.Attr.Name];
        delete relatedVideo.subcategory.subcategories_localized;

        return relatedVideo;
    }));

    video.transcripts = ResponseWrapper.wrap(video.transcripts.map(transcript => {
        transcript.collocations = ResponseWrapper.deepWrap(transcript.collocations, ['usage_examples']);
        return transcript;
    }));

    return res.send(video);
};

module.exports.like = async (req, res, next) => {
    let video, like;

    try {
        video = await Video.findByPrimary(parseInt(req.params[k.Attr.Id]));
    } catch (e) {
        return next(e);
    }

    if (!video) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    video = video.get({
        plain: true
    });

    try {
        like = await Like.create({video_id: video[k.Attr.Id], user_id: req.user[k.Attr.Id]});
    } catch (e) {
        return next(e);
    }

    if (!like) {
        res.status(404);
        return next(new GetNativeError(k.Error.CreateResourceFailure));
    }

    return res.sendStatus(204);
};

module.exports.unlike = async (req, res, next) => {
    let video;

    try {
        video = await Video.findByPrimary(+req.params[k.Attr.Id]);
    } catch (e) {
        return next(e);
    }

    if (!video) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    try {
        await Like.destroy({where: {video_id: video[k.Attr.Id], user_id: +req.user[k.Attr.Id]}, limit: 1});
    } catch (e) {
        return next(e);
    }

    res.sendStatus(204);
};

module.exports.queue = async (req, res, next) => {
    let cuedVideo;

    try {
        cuedVideo = await CuedVideo.create({video_id: +req.params[k.Attr.Id], user_id: +req.user[k.Attr.Id]});
    } catch (e) {
        return next(e);
    }

    if (!cuedVideo) {
        res.status(404);
        return next(new GetNativeError(k.Error.CreateResourceFailure));
    }

    return res.sendStatus(204);
};

module.exports.dequeue = async (req, res, next) => {
    try {
        await CuedVideo.destroy({where: {video_id: +req.params[k.Attr.Id], user_id: +req.user[k.Attr.Id]}, limit: 1});
    } catch (e) {
        return next(e);
    }

    return res.sendStatus(204);
};

module.exports.transcribe = async (req, res) => {
    const transcript = await Speech.transcribeVideo(req.files.video.path, req.query[k.Attr.LanguageCode] || 'en-US');
    return res.status(200).send({transcription: transcript});
};
