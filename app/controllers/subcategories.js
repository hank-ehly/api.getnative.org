/**
 * subcategories
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/03.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const Subcategory = db[k.Model.Subcategory];
const SubcategoryLocalized = db[k.Model.SubcategoryLocalized];
const services = require('../services');
const ModelHelper = services['Model'](db);
const GetNativeError = services['GetNativeError'];
const config = require('../../config/application').config;

const _ = require('lodash');

module.exports.create = async (req, res, next) => {
    let subcategory, retSubcategory, languages, subcategoriesLocalized = [];

    try {
        languages = await db[k.Model.Language].findAll({attributes: [k.Attr.Id, k.Attr.Code]});
    } catch (e) {
        return next(e);
    }

    if (_.size(languages) === 0) {
        throw new ReferenceError('language variable is undefined');
    }

    languages = _.invokeMap(languages, 'get', {
        plain: true
    });

    const t = await db.sequelize.transaction();

    try {
        subcategory = await Subcategory.create({category_id: req.params[k.Attr.Id]}, {transaction: t});

        for (let code of _.map(languages, k.Attr.Code)) {
            let newSubcategoryLocalized = await db[k.Model.SubcategoryLocalized].create({
                subcategory_id: subcategory.get(k.Attr.Id),
                language_id: _.find(languages, {code: code})[k.Attr.Id]
            }, {transaction: t});

            if (newSubcategoryLocalized) {
                subcategoriesLocalized.push(newSubcategoryLocalized);
            }
        }

        await t.commit();
    } catch (e) {
        await t.rollback();
        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(404);
            return next(new GetNativeError(k.Error.ResourceNotFound));
        }
        return next(e);
    }

    if (!subcategory) {
        throw new ReferenceError('subcategory variable is undefined');
    }

    if (subcategoriesLocalized.length !== languages.length) {
        await t.rollback();
        throw new Error('length of subcategoriesLocalized does not equal length of languageCodes');
    }

    try {
        retSubcategory = await Subcategory.findByPrimary(subcategory.get(k.Attr.Id), {
            attributes: [k.Attr.Id, 'category_id']
        });
    } catch (e) {
        return next(e);
    }

    if (!retSubcategory) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    retSubcategory = retSubcategory.get({
        plain: true
    });

    return res.status(201).send(retSubcategory);
};

module.exports.show = async (req, res, next) => {
    let subcategory;

    const createdAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.CreatedAt);
    const updatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.UpdatedAt);

    const subcategoryPredicate = {
        where: {
            id: +req.params.subcategory_id,
            category_id: +req.params.category_id
        },
        attributes: [k.Attr.Id, createdAt, updatedAt],
        include: [
            {
                model: db[k.Model.SubcategoryLocalized],
                attributes: [k.Attr.Id, k.Attr.Name],
                as: 'subcategories_localized',
                include: {
                    model: db[k.Model.Language],
                    attributes: [k.Attr.Code, k.Attr.Name],
                    as: 'language'
                }
            },
            {
                model: db[k.Model.Category],
                attributes: [k.Attr.Id],
                as: 'category'
            }
        ]
    };

    try {
        subcategory = await Subcategory.find(subcategoryPredicate);
    } catch (e) {
        return next(e);
    }

    if (!subcategory) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    subcategory = subcategory.get({
        plain: true
    });

    subcategory.subcategories_localized = _.zipObject(['records', 'count'], [
        subcategory.subcategories_localized, subcategory.subcategories_localized.length
    ]);

    return res.status(200).send(subcategory);
};

module.exports.update = async (req, res, next) => {
    let updateCount;

    const changeableAttributes = ['category_id'];
    const requestedChanges = _.pick(req.body, changeableAttributes);

    if (_.size(requestedChanges) === 0) {
        return res.sendStatus(304);
    }

    const subcategoryPredicate = {
        where: {
            id: req.params.subcategory_id,
            category_id: req.params.category_id
        }
    };

    try {
        [updateCount] = await Subcategory.update(requestedChanges, subcategoryPredicate);
    } catch (e) {
        return next(e);
    }

    if (updateCount === 0) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const locationCategoryId = _.defaultTo(requestedChanges.category_id, req.params.category_id);
    res.set(k.Header.Location, `/categories/${locationCategoryId}/subcategories/${req.params.subcategory_id}`);

    return res.sendStatus(204);
};

module.exports.delete = async (req, res, next) => {
    let subcategory;

    try {
        subcategory = await Subcategory.find({
            where: {
                id: req.params['subcategory_id'],
                category_id: req.params['category_id']
            },
            attributes: [k.Attr.Id],
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Id]
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!subcategory) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const t = await db.sequelize.transaction();

    try {
        const localizedSubcategoryIds = _.invokeMap(subcategory.subcategories_localized, 'get', k.Attr.Id);

        if (localizedSubcategoryIds.length) {
            await SubcategoryLocalized.destroy({
                where: {
                    id: {
                        $in: localizedSubcategoryIds
                    }
                },
                transaction: t
            });
        }

        await Subcategory.destroy({
            where: {
                id: subcategory.get(k.Attr.Id)
            },
            limit: 1,
            transaction: t
        });

        await t.commit();
    } catch (e) {
        await t.rollback();

        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(422);
            return next(new GetNativeError(k.Error.ForeignKeyConstraintError))
        }

        return next(e);
    }

    return res.sendStatus(204);
};
