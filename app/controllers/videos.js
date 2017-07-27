/**
 * videos
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../../config/keys.json');
const config = require('../../config/application').config;
const logger = require('../../config/logger');
const services = require('../services');
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError = require('../services/get-native-error');
const Utility = services['Utility'];
const Storage = services['Storage'];
const Speech = services['Speech'];
const avconv = services['Avconv'];
const db = require('../models');
const ModelHelper = services['Model'](db);
const Subcategory = db[k.Model.Subcategory];
const SubcategoryLocalized = db[k.Model.SubcategoryLocalized];
const CuedVideo = db[k.Model.CuedVideo];
const Language = db[k.Model.Language];
const Speaker = db[k.Model.Speaker];
const SpeakerLocalized = db[k.Model.SpeakerLocalized];
const Transcript = db[k.Model.Transcript];
const CollocationOccurrence = db[k.Model.CollocationOccurrence];
const UsageExample = db[k.Model.UsageExample];
const Video = db[k.Model.Video];
const Like = db[k.Model.Like];

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let videos, conditions = {};

    _.set(conditions, k.Attr.IsPublic, true);
    if (req.query.include_private && await req.user.isAdmin()) {
        _.unset(conditions, k.Attr.IsPublic);
    }

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
            model: db[k.Model.VideoLocalized],
            attributes: [k.Attr.Description],
            as: 'videos_localized',
            where: {language_id: interfaceLanguageId}
        }, {
            model: Language,
            attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code],
            as: 'language'
        }, {
            model: Transcript,
            attributes: [k.Attr.Id, k.Attr.Text],
            as: 'transcripts',
            include: [
                {
                    model: CollocationOccurrence,
                    attributes: [k.Attr.Id, k.Attr.Text, k.Attr.IPASpelling],
                    as: 'collocation_occurrences',
                    include: {
                        model: UsageExample,
                        attributes: [k.Attr.Text],
                        as: 'usage_examples'
                    }
                }, {
                    model: Language,
                    attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code],
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

        const videoAttributes = [k.Attr.Id, k.Attr.LoopCount, k.Attr.PictureUrl, k.Attr.VideoUrl, k.Attr.Length];
        if (await req.user.isAdmin()) {
            videoAttributes.push(k.Attr.IsPublic);
        }

        video = await Video.findByPrimary(+req.params[k.Attr.Id], {
            rejectOnEmpty: true,
            attributes: videoAttributes,
            include: videoInclude
        });
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
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
    _.unset(video, 'speaker.speakers_localized');

    video[k.Attr.Description] = _.first(video.videos_localized)[k.Attr.Description];
    _.unset(video, 'videos_localized');

    video.subcategory[k.Attr.Name] = _.first(video.subcategory.subcategories_localized)[k.Attr.Name];
    _.unset(video, 'subcategory.subcategories_localized');

    video.related_videos = _.invokeMap(relatedVideos, 'get', {
        plain: true
    });

    video.related_videos = ResponseWrapper.wrap(video.related_videos.map(relatedVideo => {
        relatedVideo.cued = relatedVideo.cued === 1;

        relatedVideo.speaker[k.Attr.Name] = _.first(relatedVideo.speaker.speakers_localized)[k.Attr.Name];
        _.unset(relatedVideo, 'speaker.speakers_localized');
        _.unset(relatedVideo, 'speaker.id');

        relatedVideo.subcategory[k.Attr.Name] = _.first(relatedVideo.subcategory.subcategories_localized)[k.Attr.Name];
        _.unset(relatedVideo, 'subcategory.subcategories_localized');

        return relatedVideo;
    }));

    video.transcripts = ResponseWrapper.wrap(video.transcripts.map(transcript => {
        transcript.collocation_occurrences = ResponseWrapper.deepWrap(transcript.collocation_occurrences, ['usage_examples']);
        return transcript;
    }));

    return res.send(video);
};

module.exports.like = async (req, res, next) => {
    try {
        await Like.create({video_id: parseInt(req.params[k.Attr.Id]), user_id: req.user[k.Attr.Id]});
    } catch (e) {
        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
    }

    return res.sendStatus(204);
};

module.exports.unlike = async (req, res, next) => {

    try {
        const video = await Video.findByPrimary(req.params[k.Attr.Id], {rejectOnEmpty: true});
        await Like.destroy({where: {video_id: video[k.Attr.Id], user_id: req.user[k.Attr.Id]}, limit: 1});
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }

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

module.exports.create = async (req, res, next) => {
    let video, t = await db.sequelize.transaction();

    try {
        video = await Video.create({
            language_id: req.body[k.Attr.LanguageId],
            speaker_id: req.body[k.Attr.SpeakerId],
            subcategory_id: req.body[k.Attr.SubcategoryId],
            description: req.body[k.Attr.Description],
            is_public: req.body[k.Attr.IsPublic] || false
        }, {transaction: t});

        const videosLocalized = [];
        const transcripts = [];
        for (let localization of req.body['localizations']) {
            videosLocalized.push({
                video_id: video[k.Attr.Id],
                language_id: localization[k.Attr.LanguageId],
                description: localization[k.Attr.Description]
            });
            transcripts.push({
                video_id: video[k.Attr.Id],
                language_id: localization[k.Attr.LanguageId],
                text: localization['transcript']
            });
        }
        await db[k.Model.VideoLocalized].bulkCreate(videosLocalized, {transaction: t});
        const persistedTranscripts = await Transcript.bulkCreate(transcripts, {transaction: t});

        const unsavedCollocationOccurrences = [];
        for (let transcript of persistedTranscripts) {
            let occurrenceTextValues = Utility.pluckCurlyBraceEnclosedContent(transcript.get(k.Attr.Text));
            for (let text of occurrenceTextValues) {
                unsavedCollocationOccurrences.push({
                    transcript_id: transcript.get(k.Attr.Id),
                    text: text
                });
            }
        }
        await CollocationOccurrence.bulkCreate(unsavedCollocationOccurrences, {transaction: t});
        await t.commit();
    } catch (e) {
        await t.rollback();
        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
    }

    const responseBody = {
        id: video.get(k.Attr.Id)
    };

    return res.status(201).send(responseBody);
};

module.exports.update = async (req, res, next) => {
    if (_.size(req.body) === 0) {
        return res.sendStatus(304);
    }

    const t = await db.sequelize.transaction();
    const videoUpdates = _.pick(req.body, [k.Attr.IsPublic, k.Attr.LanguageId, k.Attr.SpeakerId, k.Attr.SubcategoryId]);

    try {
        if (_.size(videoUpdates) > 0) {
            await Video.update(videoUpdates, {
                where: {id: req.params[k.Attr.Id]},
                transaction: t
            });
        }

        if (_.has(req.body, 'localizations') && _.size(req.body['localizations']) > 0) {
            for (let localization of req.body['localizations']) {
                let changes = _.pick(localization, [k.Attr.Description, 'transcript']);
                await db[k.Model.VideoLocalized].update(changes, {
                    where: {id: localization[k.Attr.Id]},
                    transaction: t
                });
            }
        }

        await t.commit();
    } catch (e) {
        await t.rollback();
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.upload = async (req, res, next) => {
    let video;

    try {
        video = await Video.findByPrimary(req.params[k.Attr.Id], {rejectOnEmpty: true});
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
    }

    const videoIdHash = Utility.getHashForId(_.toNumber(req.params[k.Attr.Id]));

    const length = await avconv.getVideoDuration(req.files.video.path);

    const videoDimensions = await avconv.getDimensionsOfVisualMediaAtPath(req.files.video.path);
    const maxSize = Utility.findMaxSizeForAspectInSize({width: 3, height: 2}, videoDimensions);

    const croppedVideoPath = await avconv.cropVideoToSize(req.files.video.path, maxSize);
    const thumbnailImagePath = await avconv.captureFirstFrameOfVideo(croppedVideoPath);

    await Storage.upload(croppedVideoPath, ['videos/', videoIdHash, '.', config.get(k.VideoFileExtension)].join(''));
    await Storage.upload(thumbnailImagePath, ['videos/', videoIdHash, '.', config.get(k.ImageFileExtension)].join(''));

    const bucket = config.get(k.GoogleCloud.StorageBucketName);
    const googleStorageBaseURI = 'https://storage.googleapis.com';

    try {
        await video.update({
            video_url: `${googleStorageBaseURI}/${bucket}/videos/${videoIdHash}.${config.get(k.VideoFileExtension)}`,
            picture_url: `${googleStorageBaseURI}/${bucket}/videos/${videoIdHash}.${config.get(k.ImageFileExtension)}`,
            length: length
        });

        await video.reload({
            attributes: [k.Attr.VideoUrl, k.Attr.PictureUrl]
        });
    } catch (e) {
        return next(e);
    }

    return res.status(200).send(_.pick(video.get({plain: true}), [k.Attr.VideoUrl, k.Attr.PictureUrl]));
};

module.exports.videosLocalized = async (req, res, next) => {
    let countAndRows;

    try {
        countAndRows = await db[k.Model.VideoLocalized].findAndCount({
            attributes: [k.Attr.Id, k.Attr.Description, 'language_id', 'video_id'],
            where: {video_id: req.params[k.Attr.Id]}
        });
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const {count, rows} = countAndRows;

    const responseBody = {
        records: _.invokeMap(rows, 'get', {plain: true}),
        count: count
    };

    return res.status(200).send(responseBody);
};

module.exports.collocationOccurrences = {};

module.exports.collocationOccurrences.index = async (req, res, next) => {
    let video;

    try {
        video = await db[k.Model.Video].findByPrimary(req.params[k.Attr.Id], {
            rejectOnEmpty: true,
            include: {
                model: db[k.Model.Transcript],
                as: 'transcripts',
                include: {
                    model: db[k.Model.CollocationOccurrence],
                    as: 'collocation_occurrences',
                    order: [[k.Attr.CreatedAt, 'DESC']],
                    include: {
                        model: db[k.Model.UsageExample],
                        attributes: [k.Attr.Id, k.Attr.Text],
                        as: 'usage_examples'
                    }
                }
            }
        });
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }

        return next(e);
    }

    let occurrences = _.flatten(_.invokeMap(video.transcripts, 'get', 'collocation_occurrences'));

    let occurrencesZippedUsageExamples = _.map(occurrences, o => {
        o = o.get({plain: true});
        _.set(o, 'usage_examples', _.zipObject(['records', 'count'], [o.usage_examples, o.usage_examples.length]));
        return o;
    });

    const responseBody = _.zipObject(['records', 'count'], [occurrencesZippedUsageExamples, occurrencesZippedUsageExamples.length]);

    return res.status(200).send(responseBody);
};
