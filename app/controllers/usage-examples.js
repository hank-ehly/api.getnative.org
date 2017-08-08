/**
 * usage-examples
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/13.
 */

const db = require('../models');
const k = require('../../config/keys.json');
const GetNativeError = require('../services/get-native-error');

const _ = require('lodash');

module.exports.create = async (req, res, next) => {
    let usageExample;

    try {
        usageExample = await db[k.Model.UsageExample].create({
            text: req.body[k.Attr.Text],
            collocation_occurrence_id: req.params[k.Attr.Id]
        });
    } catch (e) {
        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ForeignKeyConstraintError))
        }
        return next(e);
    }

    usageExample = usageExample.get({plain: true});

    const responseBody = {
        id: usageExample[k.Attr.Id],
        text: usageExample[k.Attr.Text],
        collocation_occurrence_id: _.toNumber(usageExample[k.Attr.CollocationOccurrenceId])
    };

    return res.status(201).send(responseBody);
};

module.exports.delete = async (req, res, next) => {
    let rowsAffected;

    try {
        rowsAffected = await db[k.Model.UsageExample].destroy({
            where: {
                id: req.params[k.Attr.Id]
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!rowsAffected) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};

module.exports.update = async (req, res, next) => {
    if (_.size(req.body) === 0) {
        return res.sendStatus(304);
    }

    let updateCount;

    try {
        [updateCount] = await db[k.Model.UsageExample].update(req.body, {
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
