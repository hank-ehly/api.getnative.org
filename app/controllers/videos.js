/**
 * videos
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../../config/keys.json');
const ResponseWrapper = require('../services/response-wrapper');
const GetNativeError = require('../services/get-native-error');
const Utility = require('../services/utility');
const db = require('../models');
const ModelHelper = require('../services/model')(db);
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
const YouTube = require('../services/youtube');

const moment = require('moment');
const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let videos, conditions = {}, isAuthenticated = req.isAuthenticated();

    if (req.query.include_private && isAuthenticated && await req.user.isAdmin()) {
        delete conditions[k.Attr.IsPublic];
    } else {
        conditions[k.Attr.IsPublic] = true;
    }

    conditions.language_id = await Language.findIdForCode(_.defaultTo(req.query.lang, 'en'));
    const subcategoryIds = await Subcategory.findIdsForCategoryIdOrSubcategoryId(req.query);
    if (subcategoryIds.length) {
        conditions.subcategory_id = {$in: subcategoryIds};
    }

    const queryAttrs = [
        k.Attr.Id,
        k.Attr.YouTubeVideoId,
        ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset)
    ];

    const fallbackCode = isAuthenticated ? req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code) : req.locale;
    const interfaceLanguageId = await Language.findIdForCode(_.defaultTo(req.query.interface_lang, fallbackCode));

    const queryScopes = [
        {method: ['count', req.query.count]},
        {method: ['includeSpeaker', interfaceLanguageId]},
        {method: ['includeSubcategory', interfaceLanguageId]},
        'newestFirst'
    ];

    if (isAuthenticated) {
        queryAttrs.push(Video.getCuedAttributeForUserId(req.user[k.Attr.Id]));
        queryScopes.push({method: ['cuedAndMaxId', req.query.cued_only, req.user[k.Attr.Id], req.query.max_id]})
    } else {
        queryScopes.push({method: ['cuedAndMaxId', null, null, req.query.max_id]});
    }

    try {
        videos = await Video.scope(queryScopes).findAll({attributes: queryAttrs, where: conditions});
    } catch (e) {
        return next(new GetNativeError(e));
    }

    if (_.isEmpty(videos)) {
        return res.send({records: [], count: 0});
    }

    videos = _.invokeMap(videos, 'get', {plain: true});

    const videoIdx = _.map(videos, k.Attr.YouTubeVideoId);
    const ytRes = await YouTube.videosList(videoIdx, ['contentDetails', 'statistics']);
    const ytVideos = ytRes.items;

    const videoList = _.map(videos, video => {
        let ytVideo = _.find(ytVideos, {id: video[k.Attr.YouTubeVideoId]});
        let ISO8601Duration = _.get(ytVideo, 'contentDetails.duration');

        video[k.Attr.LoopCount] = parseInt(_.get(ytVideo, 'statistics.viewCount'));
        video[k.Attr.Length] = moment.duration(ISO8601Duration).asSeconds();

        if (isAuthenticated) {
            video.cued = video.cued === 1;
        }

        video.speaker[k.Attr.Name] = _.first(video.speaker.speakers_localized)[k.Attr.Name];
        delete video.speaker.speakers_localized;

        video.subcategory[k.Attr.Name] = _.first(video.subcategory.subcategories_localized)[k.Attr.Name];
        delete video.subcategory.subcategories_localized;

        return video;
    });

    videos = ResponseWrapper.wrap(videoList);
    return res.send(videos);
};

module.exports.show = async (req, res, next) => {
    let video, relatedVideos, youTubeVideos, isAuthenticated = req.isAuthenticated();

    const defaultInterfaceLanguageCode = isAuthenticated ? req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code) : req.locale;
    const interfaceLanguageCode = _.defaultTo(req.query.lang, defaultInterfaceLanguageCode);
    const interfaceLanguageId = await Language.findIdForCode(interfaceLanguageCode);

    const primaryVideoQueryAttrs = [k.Attr.Id, k.Attr.YouTubeVideoId];
    const relatedVideoQueryAttrs = [
        k.Attr.Id,
        k.Attr.YouTubeVideoId,
        ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Video, k.Attr.CreatedAt, req.query.time_zone_offset)
    ];

    const primaryVideoId = parseInt(req.params[k.Attr.Id]);

    if (isAuthenticated) {
        primaryVideoQueryAttrs.push(k.Attr.IsPublic);
        if (await req.user.isAdmin()) {
            relatedVideoQueryAttrs.push(Video.getCuedAttributeForUserId(req.user[k.Attr.Id]));
        }
    }

    const relatedVideoQueryScopes = [
        {method: ['includeSpeaker', interfaceLanguageId]},
        {method: ['includeSubcategory', interfaceLanguageId]},
        {method: ['relatedToVideo', primaryVideoId]},
        'orderByRandom'
    ];

    const primaryVideoQueryScopes = [
        {method: ['includeSpeaker', interfaceLanguageId]},
        {method: ['includeSubcategory', interfaceLanguageId]},
        'includeLanguage',
        'includeTranscripts'
    ];

    try {
        video = await Video.scope(primaryVideoQueryScopes).findByPrimary(primaryVideoId, {
            rejectOnEmpty: true,
            attributes: primaryVideoQueryAttrs
        });

        relatedVideos = await Video.scope(relatedVideoQueryScopes).findAll({
            attributes: relatedVideoQueryAttrs,
            limit: 3
        });

        video = video.get({plain: true});
        video['related_videos'] = _.invokeMap(relatedVideos, 'get', {plain: true});

        const videoIdx = [video[k.Attr.YouTubeVideoId], _.map(video['related_videos'], k.Attr.YouTubeVideoId)];
        const youTubeRes = await YouTube.videosList(videoIdx, ['snippet', 'contentDetails', 'statistics'], interfaceLanguageCode);
        youTubeVideos = youTubeRes.items;

        video['like_count'] = await Video.getLikeCount(db, req.params.id);

        if (isAuthenticated) {
            video.liked = await Video.isLikedByUser(db, req.params.id, req.user[k.Attr.Id]);
            video.cued = await Video.isCuedByUser(req.params.id, req.user[k.Attr.Id]);
        }
    } catch (e) {
        if (e instanceof db.sequelize.EmptyResultError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
    }

    const primaryYouTubeVideo = _.find(youTubeVideos, {id: video[k.Attr.YouTubeVideoId]});

    video[k.Attr.Length] = moment.duration(primaryYouTubeVideo['contentDetails']['duration']).asSeconds();
    video[k.Attr.LoopCount] = parseInt(primaryYouTubeVideo['statistics']['viewCount']);
    video[k.Attr.Description] = primaryYouTubeVideo['snippet']['localized']['description'];
    video['speaker'][k.Attr.Name] = video['speaker']['speakers_localized'][0][k.Attr.Name];
    video['speaker'][k.Attr.Description] = video['speaker']['speakers_localized'][0][k.Attr.Description];
    video['subcategory'][k.Attr.Name] = video['subcategory']['subcategories_localized'][0][k.Attr.Name];

    delete video['speaker']['speakers_localized'];
    delete video['subcategory']['subcategories_localized'];

    video['related_videos'] = _.map(video['related_videos'], video => {
        const relatedYouTubeVideo = _.find(youTubeVideos, {id: video[k.Attr.YouTubeVideoId]});

        video[k.Attr.Length] = moment.duration(relatedYouTubeVideo['contentDetails']['duration']).asSeconds();
        video[k.Attr.LoopCount] = parseInt(relatedYouTubeVideo['statistics']['viewCount']);
        video['speaker'][k.Attr.Name] = video['speaker']['speakers_localized'][0][k.Attr.Name];
        video['subcategory'][k.Attr.Name] = video['subcategory']['subcategories_localized'][0][k.Attr.Name];

        delete video['speaker']['speakers_localized'];
        delete video['speaker'][k.Attr.Id];
        delete video['subcategory']['subcategories_localized'];

        if (isAuthenticated) {
            video['cued'] = video['cued'] === 1;
        }

        return video;
    });

    video['transcripts'] = _.map(video['transcripts'], transcript => {
        transcript['collocation_occurrences'] = ResponseWrapper.deepWrap(transcript['collocation_occurrences'], ['usage_examples']);
        return transcript;
    });

    for (const key of ['related_videos', 'transcripts']) {
        video[key] = _.zipObject(['records', 'count'], [video[key], video[key].length]);
    }

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

module.exports.create = async (req, res, next) => {
    const youtubeVideoId = req.body[k.Attr.YouTubeVideoId];

    try {
        await YouTube.videosList([youtubeVideoId]);
    } catch (e) {
        return res.status(404).send(new GetNativeError(k.Error.YouTubeVideoDoesNotExist));
    }

    let video, t = await db.sequelize.transaction();

    const params = {
        youtube_video_id: youtubeVideoId,
        language_id: req.body[k.Attr.LanguageId],
        speaker_id: req.body[k.Attr.SpeakerId],
        subcategory_id: req.body[k.Attr.SubcategoryId],
        is_public: req.body[k.Attr.IsPublic] || false
    };

    try {
        video = await Video.create(params, {transaction: t});

        // Transcripts
        let transcripts = [];
        for (let localization of req.body['localizations']) {
            transcripts.push({
                video_id: video[k.Attr.Id],
                language_id: localization[k.Attr.LanguageId],
                text: localization['transcript']
            });
        }
        transcripts = await Transcript.bulkCreate(transcripts, {transaction: t});

        // WritingQuestions
        let questions = [];
        let localizedQuestions = [];
        for (let locale of req.body['localizations']) {
            for (let question of locale['writing_questions']) {
                questions.push({subcategory_id: params.subcategory_id});

                localizedQuestions.push({
                    text: question[k.Attr.Text],
                    example_answer: question[k.Attr.ExampleAnswer],
                    language_id: locale[k.Attr.LanguageId]
                });
            }
        }
        questions = await db[k.Model.WritingQuestion].bulkCreate(questions, {transaction: t});

        for (let i = 0; i < questions.length; i++) {
            localizedQuestions[i][k.Attr.WritingQuestionId] = questions[i].get(k.Attr.Id);
        }
        await db[k.Model.WritingQuestionLocalized].bulkCreate(localizedQuestions, {transaction: t});

        // CollocationOccurrences
        const unsavedCollocationOccurrences = [];
        for (let transcript of transcripts) {
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

    return res.status(201).send({id: video.get(k.Attr.Id)});
};

module.exports.update = async (req, res, next) => {
    const updateQueryAttrs = _.pick(req.body, [
        k.Attr.YouTubeVideoId,
        k.Attr.IsPublic,
        k.Attr.LanguageId,
        k.Attr.SpeakerId,
        k.Attr.SubcategoryId,
        'localizations.writing_questions'
    ]);

    if (_.isEmpty(updateQueryAttrs)) {
        return res.sendStatus(304);
    }

    if (req.body[k.Attr.YouTubeVideoId]) {
        try {
            await YouTube.videosList([req.body[k.Attr.YouTubeVideoId]]);
        } catch (e) {
            return res.status(404).send(new GetNativeError(k.Error.YouTubeVideoDoesNotExist));
        }
    }

    const t = await db.sequelize.transaction();

    try {
        await Video.update(updateQueryAttrs, {
            where: {
                id: req.params[k.Attr.Id]
            },
            transaction: t
        });

        // TODO: Update transcripts
        // if (_.has(req.body, 'localizations') && _.size(req.body['localizations']) > 0) {
        //     for (let localization of req.body['localizations']) {
        //         let changes = _.pick(localization, ['transcript']);
        //     }
        // }

        await t.commit();
    } catch (e) {
        await t.rollback();
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};
