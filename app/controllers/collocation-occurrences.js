/**
 * collocation-occurrences
 * api.get-native.com
 *
 * Created by henryehly on 2017/07/13.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const GetNativeError = require('../services/get-native-error');

const _ = require('lodash');

module.exports.update = async (req, res, next) => {
    if (_.size(req.body) === 0) {
        return res.sendStatus(304);
    }

    let updateCount;

    try {
        [updateCount] = await db[k.Model.CollocationOccurrence].update(req.body, {
            where: {
                id: req.params[k.Attr.Id]
            }
        });
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.show = async (req, res, next) => {
    let col;

    try {
        col = await db[k.Model.CollocationOccurrence].findByPrimary(req.params[k.Attr.Id], {
            include: {
                model: db[k.Model.UsageExample],
                attributes: [k.Attr.Id, k.Attr.Text],
                as: 'usage_examples'
            }
        });
    } catch (e) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    if (!col) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    col = col.get({plain: true});

    _.set(col, 'usage_examples', _.zipObject(['records', 'count'], [col.usage_examples, col.usage_examples.length]));

    return res.send(col);
};
