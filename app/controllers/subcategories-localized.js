/**
 * subcategories-localized
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/06/12.
 */

const GetNativeError = require('../services')['GetNativeError'];
const db = require('../models');
const k = require('../../config/keys.json');

const _ = require('lodash');

module.exports.update = async (req, res, next) => {
    let updatedCount;

    const changeableAttributes = [k.Attr.Name];
    const requestedChanges = _.pick(req.body, changeableAttributes);

    if (_.size(requestedChanges) === 0) {
        return res.sendStatus(304);
    }

    try {
        [updatedCount] = await db[k.Model.SubcategoryLocalized].update(requestedChanges, {
            where: {
                subcategory_id: req.params.subcategory_id,
                id: req.params.subcategories_localized_id
            }
        });
    } catch (e) {
        return next(e);
    }

    if (updatedCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    return res.sendStatus(204);
};
