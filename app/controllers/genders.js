/**
 * genders
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/04.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const GetNativeError = require('../services')['GetNativeError'];
const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let countAndRows;

    try {
        countAndRows = await db[k.Model.Gender].findAndCountAll(); // Promise<{count: Integer, rows: Model[]}>
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
