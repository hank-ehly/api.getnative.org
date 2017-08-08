/**
 * speakers-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/04.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const GetNativeError = require('../services')['GetNativeError'];
const _ = require('lodash');

module.exports.show = async (req, res, next) => {
    let countAndRows;

    try {
        countAndRows = await db[k.Model.SpeakerLocalized].findAndCount({
            attributes: [k.Attr.Id, k.Attr.Description, k.Attr.Name, k.Attr.Location],
            where: {speaker_id: req.params[k.Attr.Id]},
            include: {
                model: db[k.Model.Language],
                attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code],
                as: 'language'
            }
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
