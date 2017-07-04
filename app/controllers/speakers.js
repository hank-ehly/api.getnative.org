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

module.exports.show = async (req, res, next) => {
    let speaker;

    const interfaceLanguageId = await Language.findIdForCode(
        _.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Code))
    );

    try {
        speaker = await Speaker.findByPrimary(req.params[k.Attr.Id], {
            attributes: {exclude: [k.Attr.CreatedAt, k.Attr.UpdatedAt]},
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
        return next(e);
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
