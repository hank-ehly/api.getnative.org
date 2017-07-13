/**
 * speakers
 * get-native.com
 *
 * Created by henryehly on 2017/03/16.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const Speaker = db[k.Model.Speaker];
const Language = db[k.Model.Language];
const SpeakerLocalized = db[k.Model.SpeakerLocalized];
const GetNativeError = require('../services')['GetNativeError'];

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let countAndRows;

    const interfaceLanguageId = await Language.findIdForCode(
        _.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code))
    );

    try {
        countAndRows = await Speaker.findAndCount({
            attributes: [k.Attr.Id, k.Attr.PictureUrl, k.Attr.IsSilhouettePicture],
            include: [
                {
                    model: SpeakerLocalized,
                    as: 'speakers_localized',
                    attributes: [k.Attr.Description, k.Attr.Location, k.Attr.Name],
                    where: {language_id: interfaceLanguageId}
                }, {
                    model: db[k.Model.Gender],
                    as: 'gender'
                }
            ]
        });
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const {count, rows} = countAndRows;

    if (count === 0) {
        return res.status(200).send({records: [], count: 0});
    }

    const records = _.map(rows, speaker => {
        speaker = speaker.get({plain: true});
        speaker[k.Attr.Name] = _.first(speaker.speakers_localized)[k.Attr.Name];
        speaker[k.Attr.Description] = _.first(speaker.speakers_localized)[k.Attr.Description];
        speaker[k.Attr.Location] = _.first(speaker.speakers_localized)[k.Attr.Location];
        _.unset(speaker, 'speakers_localized');
        return speaker;
    });

    const responseBody = {
        records: records,
        count: count
    };

    return res.status(200).send(responseBody);
};

module.exports.show = async (req, res, next) => {
    let speaker;

    const interfaceLanguageId = await Language.findIdForCode(
        _.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code))
    );

    try {
        speaker = await Speaker.findByPrimary(req.params[k.Attr.Id], {
            attributes: {exclude: [k.Attr.CreatedAt, k.Attr.UpdatedAt, 'gender_id']},
            include: [
                {
                    model: SpeakerLocalized,
                    as: 'speakers_localized',
                    attributes: [k.Attr.Description, k.Attr.Location, k.Attr.Name],
                    where: {language_id: interfaceLanguageId}
                },
                {
                    model: db[k.Model.Gender],
                    as: 'gender'
                }
            ]
        });
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    if (!speaker) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    speaker = speaker.get({
        plain: true
    });

    speaker[k.Attr.Name]        = _.first(speaker.speakers_localized)[k.Attr.Name];
    speaker[k.Attr.Description] = _.first(speaker.speakers_localized)[k.Attr.Description];
    speaker[k.Attr.Location]    = _.first(speaker.speakers_localized)[k.Attr.Location];

    delete speaker.speakers_localized;

    res.send(speaker);
};

module.exports.create = async (req, res, next) => {
    let speaker, speakersLocalized = [];

    const t = await db.sequelize.transaction();

    try {
        speaker = await Speaker.create({gender_id: req.body[k.Attr.GenderId]}, {transaction: t});

        for (let localization of req.body['localizations']) {
            speakersLocalized.push({
                speaker_id: speaker.get(k.Attr.Id),
                language_id: localization[k.Attr.LanguageId],
                description: localization[k.Attr.Description],
                location: localization[k.Attr.Location],
                name: localization[k.Attr.Name]
            });
        }

        await db[k.Model.SpeakerLocalized].bulkCreate(speakersLocalized, {transaction: t});
        await t.commit();
    } catch (e) {
        await t.rollback();
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    if (!speaker) {
        throw new ReferenceError('speaker variable is undefined');
    }

    return res.status(201).send({id: speaker.get(k.Attr.Id)});
};
