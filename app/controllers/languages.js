/**
 * languages
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/21.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const GetNativeError = require('../services')['GetNativeError'];

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let languages;

    try {
        languages = await db[k.Model.Language].findAndCountAll({
            attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code]
        });
    } catch (e) {
        return next(e);
    }

    if (!languages) {
        return res.status(200).send({
            records: [],
            count: 0
        });
    }

    languages.rows = _.invokeMap(languages.rows, 'get', {plain: true});
    const retLanguages = _.zipObject(['records', 'count'], [languages.rows, languages.count]);
    return res.status(200).send(retLanguages);
};
