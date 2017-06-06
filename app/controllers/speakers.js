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
    let speaker, interfaceLanguageId;

    // todo: this is the same as in category.index -- should refactor
    if (req.query.lang) {
        let requestedLanguage;
        try {
            requestedLanguage = await Language.find({
                where: {
                    code: req.query.lang
                },
                attributes: [k.Attr.Id]
            });
        } catch (e) {
            return next(e);
        }

        if (requestedLanguage) {
            interfaceLanguageId = requestedLanguage.get(k.Attr.Id)
        } else {
            interfaceLanguageId = req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Id)
        }
    } else {
        interfaceLanguageId = req.user.get(k.Attr.InterfaceLanguage).get(k.Attr.Id)
    }
    //

    try {
        speaker = await Speaker.findByPrimary(req.params[k.Attr.Id], {
            attributes: {
                exclude: [
                    k.Attr.CreatedAt, k.Attr.UpdatedAt
                ]
            },
            include: [
                {
                    model: SpeakerLocalized,
                    as: 'speakers_localized',
                    attributes: [
                        k.Attr.Description, k.Attr.Location, k.Attr.Name
                    ],
                    where: {
                        language_id: interfaceLanguageId
                    }
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

    speaker[k.Attr.Name] = _.first(speaker.speakers_localized)[k.Attr.Name];
    speaker[k.Attr.Description] = _.first(speaker.speakers_localized)[k.Attr.Description];
    speaker[k.Attr.Location] = _.first(speaker.speakers_localized)[k.Attr.Location];

    delete speaker.speakers_localized;

    res.send(speaker);
};
