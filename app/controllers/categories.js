/**
 * categories
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const k = require('../../config/keys.json');
const db = require('../models');
const config = require('../../config/application').config;
const Category = db[k.Model.Category];
const CategoryLocalized = db[k.Model.CategoryLocalized];
const Subcategory = db[k.Model.Subcategory];
const SubcategoryLocalized = db[k.Model.SubcategoryLocalized];
const Language = db[k.Model.Language];
const services = require('../services');
const ResponseWrapper = services['ResponseWrapper'];
const GetNativeError = services['GetNativeError'];
const ModelHelper = services['Model'](db);

const _ = require('lodash');

module.exports.index = async (req, res, next) => {
    let categories;

    const interfaceLanguageId = await Language.findIdForCode(_.defaultTo(req.query.lang, req.user.get(k.Attr.InterfaceLanguage)
        .get(k.Attr.Code)));

    const requireSubcategories = [null, undefined, true, 'true'].includes(req.query.require_subcategories);

    const include = [
        {
            model: CategoryLocalized,
            as: 'categories_localized',
            attributes: [k.Attr.Name],
            where: {language_id: interfaceLanguageId}
        }, {
            model: Subcategory,
            as: 'subcategories',
            attributes: [k.Attr.Id],
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Name],
                required: requireSubcategories,
                where: {language_id: interfaceLanguageId}
            }

        }
    ];

    try {
        categories = await Category.findAll({
            attributes: [k.Attr.Id],
            include: include
        });
    } catch (e) {
        return next(e);
    }

    categories = _.invokeMap(categories, 'get', {
        plain: true
    });

    categories = _.map(categories, category => {
        category.name = _.first(category.categories_localized)[k.Attr.Name];
        delete category.categories_localized;

        category.subcategories = _.map(category.subcategories, subcategory => {
            subcategory.name = _.first(subcategory.subcategories_localized)[k.Attr.Name];
            delete subcategory.subcategories_localized;
            return subcategory;
        });

        category.subcategories = _.zipObject(['records', 'count'], [category.subcategories, category.subcategories.length]);
        return category;
    });

    categories = _.zipObject(['records', 'count'], [categories, categories.length]);
    return res.send(categories);
};

module.exports.show = async (req, res, next) => {
    let category, subcategories;

    const categoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.CreatedAt);
    const categoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.UpdatedAt);

    try {
        category = await Category.findByPrimary(req.params[k.Attr.Id], {
            attributes: [k.Attr.Id, categoryCreatedAt, categoryUpdatedAt],
            include: {
                model: CategoryLocalized,
                as: 'categories_localized',
                attributes: [k.Attr.Name, k.Attr.Id],
                required: false,
                include: {
                    model: Language,
                    as: 'language',
                    attributes: [k.Attr.Name, k.Attr.Code]
                }
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!category) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    category = category.get({
        plain: true
    });

    category.categories_localized = _.zipObject(['records', 'count'], [
        category.categories_localized, category.categories_localized.length
    ]);

    const subcategoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.CreatedAt);
    const subcategoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Subcategory, k.Attr.UpdatedAt);

    try {
        const englishLanguageId = await Language.findIdForCode('en');

        subcategories = await Subcategory.findAll({
            where: {category_id: req.params[k.Attr.Id]},
            attributes: [k.Attr.Id, subcategoryCreatedAt, subcategoryUpdatedAt],
            include: {
                model: SubcategoryLocalized,
                as: 'subcategories_localized',
                attributes: [k.Attr.Name],
                where: {language_id: englishLanguageId}
            }
        });
    } catch (e) {
        return next(e);
    }

    subcategories = _.invokeMap(subcategories, 'get', {
        plain: true
    });

    subcategories = _.map(subcategories, subcategory => {
        subcategory[k.Attr.Name] = _.first(subcategory.subcategories_localized)[k.Attr.Name];
        return _.omit(subcategory, 'subcategories_localized');
    });

    category.subcategories = _.zipObject(['records', 'count'], [subcategories, subcategories.length]);

    return res.send(category);
};

module.exports.create = async (req, res, next) => {
    let category, retCategory, languages;
    const categoriesLocalized = [], languageCodes = config.get(k.VideoLanguageCodes);

    try {
        languages = await Language.findAll({
            attributes: [k.Attr.Id, k.Attr.Code]
        });
    } catch (e) {
        return next(e);
    }

    if (_.size(languages) === 0) {
        throw new ReferenceError('language variable is undefined');
    }

    languages = _.invokeMap(languages, 'get', {
        plain: true
    });

    const transaction = await db.sequelize.transaction();

    try {
        category = await Category.create({}, {transaction: transaction});

        for (let code of languageCodes) {
            let newCategoryLocalized = await CategoryLocalized.create({
                category_id: category.get(k.Attr.Id),
                language_id: _.find(languages, {code: code})[k.Attr.Id]
            }, {transaction: transaction});

            if (newCategoryLocalized) {
                categoriesLocalized.push(newCategoryLocalized);
            }
        }

        await transaction.commit();
    } catch (e) {
        await transaction.rollback();
        return next(e);
    }

    if (!category) {
        throw new ReferenceError('category variable is undefined');
    }

    if (categoriesLocalized.length !== languageCodes.length) {
        await transaction.rollback();
        throw new Error('length of categoriesLocalized does not equal length of languageCodes');
    }

    const retCategoryCreatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.CreatedAt);
    const retCategoryUpdatedAt = ModelHelper.getDateAttrForTableColumnTZOffset(k.Model.Category, k.Attr.UpdatedAt);

    try {
        retCategory = await Category.findByPrimary(category.get(k.Attr.Id), {
            attributes: [k.Attr.Id, retCategoryCreatedAt, retCategoryUpdatedAt],
            include: {
                model: CategoryLocalized,
                as: 'categories_localized',
                attributes: [k.Attr.Name, k.Attr.Id],
                required: false,
                include: {
                    model: Language,
                    as: 'language',
                    attributes: [k.Attr.Name, k.Attr.Code]
                }
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!retCategory) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    retCategory = retCategory.get({
        plain: true
    });

    retCategory.categories_localized = _.zipObject(['records', 'count'], [
        retCategory.categories_localized, retCategory.categories_localized.length
    ]);

    res.set(k.Header.Location, `/categories/${category.get(k.Attr.Id)}`);
    return res.status(201).send(retCategory);
};

module.exports.delete = async (req, res, next) => {
    let category;

    try {
        category = await Category.findByPrimary(req.params[k.Attr.Id], {
            attributes: [k.Attr.Id],
            include: {
                model: CategoryLocalized,
                as: 'categories_localized',
                attributes: [k.Attr.Id]
            }
        });
    } catch (e) {
        return next(e);
    }

    if (!category) {
        res.status(404);
        return next(new GetNativeError(k.Error.ResourceNotFound));
    }

    const t = await db.sequelize.transaction();

    try {
        const localizedCategoryIds = _.invokeMap(category.categories_localized, 'get', k.Attr.Id);

        if (localizedCategoryIds.length) {
            await CategoryLocalized.destroy({
                where: {
                    id: {
                        $in: localizedCategoryIds
                    }
                }
            }, {
                transaction: t
            });
        }

        await Category.destroy({
            where: {
                id: category.get(k.Attr.Id)
            },
            limit: 1
        }, {
            transaction: t
        });

        await t.commit();
    } catch (e) {
        await t.rollback();

        if (e instanceof db.sequelize.ForeignKeyConstraintError) {
            res.status(422);
            return next(new GetNativeError(k.Error.TokenExpired))
        }

        return next(e);
    }

    return res.sendStatus(204);
};
