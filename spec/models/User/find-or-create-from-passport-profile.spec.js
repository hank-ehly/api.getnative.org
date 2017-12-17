/**
 * find-or-create-from-passport-profile.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/25.
 */

const SpecUtil   = require('../../spec-util');
const k          = require('../../../config/keys.json');
const db         = require('../../../app/models');
const User       = db[k.Model.User];
const Language   = db[k.Model.Language];
const Identity   = db[k.Model.Identity];
const AuthAdapterType = db[k.Model.AuthAdapterType];

const chance     = require('chance').Chance();
const assert     = require('assert');
const mocha      = require('mocha');
const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const _          = require('lodash');

describe('User.findOrCreateFromPassportProfile', function() {
    let languages, authAdapterTypes, profile, server;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);

        await SpecUtil.seedAllUndo();

        [languages, authAdapterTypes] = [
            await Language.bulkCreate([{name: 'English', code: 'en'}, {name: '日本語', code: 'ja'}]),
            await AuthAdapterType.bulkCreate([{name: 'facebook'}, {name: 'twitter'}, {name: 'local'}]),
            await db[k.Model.Role].bulkCreate([{description: 'x', name: k.UserRole.Admin}, {description: 'x', name: k.UserRole.User}])
        ];
    });

    beforeEach(async function() {
        profile = {
            id: chance.string({
                length: 13,
                pool: '0123456789'
            }),
            displayName: chance.name(),
            emails: [{value: chance.email()}],
            photos: [{value: 'https://pbs.twimg.com/profile_images/269279233/llama270977_smiling_llama_400x400.jpg'}],
            provider: _.sample(['facebook', 'twitter'])
        };
    });

    afterEach(async function() {
        await db[k.Model.VerificationToken].destroy({where: {}});
        await db[k.Model.UserRole].destroy({where: {}, force: true});
        await Identity.destroy({where: {}, force: true});
        await User.destroy({where: {}, force: true});
    });

    describe('in all situations', function() {
        let user;

        beforeEach(async function() {
            user = await User.findOrCreateFromPassportProfile(profile, {locale: 'en'});
        });

        it('should return a User record with an id integer attribute', async function() {
            assert(_.isNumber(user.get(k.Attr.Id)));
        });

        it('should return a User record with a name string attribute', async function() {
            assert(_.isString(user.get(k.Attr.Name)));
        });

        it('should return a User record with an email string attribute', async function() {
            assert(SpecUtil.isValidEmail(user.get(k.Attr.Email)));
        });

        it('should return a User record with a browser_notifications_enabled boolean attribute', async function() {
            assert(_.isBoolean(user.get(k.Attr.BrowserNotificationsEnabled)));
        });

        it('should return a User record with an email_notifications_enabled boolean attribute', async function() {
            assert(_.isBoolean(user.get(k.Attr.EmailNotificationsEnabled)));
        });

        it('should return a User record with an email_verified boolean attribute', async function() {
            assert(_.isBoolean(user.get(k.Attr.EmailVerified)));
        });

        it('should return a User record with an is_silhouette_picture boolean attribute', async function() {
            assert(_.isBoolean(user.get(k.Attr.IsSilhouettePicture)));
        });

        it('should return a User record with an picture_url string attribute', async function() {
            assert(_.isString(user.get(k.Attr.PictureUrl)));
        });

        it('should return a User record with a default_study_language plain object attribute', async function() {
            assert(_.isPlainObject(user.get({plain: true})[k.Attr.DefaultStudyLanguage]));
        });

        it('should return a User record with a default_study_language.code string attribute', async function() {
            assert(_.isString(user.get(k.Attr.DefaultStudyLanguage)[k.Attr.Code]));
        });

        it('should return a User record with a default_study_language.name string attribute', async function() {
            assert(_.isString(user.get(k.Attr.DefaultStudyLanguage)[k.Attr.Name]));
        });
    });

    describe('given a completely new User', function() {
        beforeEach(async function() {
            await User.findOrCreateFromPassportProfile(profile, {locale: 'en'});
        });

        it('should create a new User record', async function() {
            const user = await User.find({
                where: {
                    email: _.first(profile.emails).value,
                    name: profile.displayName
                }
            });

            assert(user);
        });

        it('should create a new Identity record linked to the new user record', async function() {
            const user = await User.find({
                where: {
                    email: _.first(profile.emails).value,
                    name: profile.displayName
                }
            });

            const identity = await Identity.find({
                where: {
                    user_id: user.get(k.Attr.Id),
                    auth_adapter_user_id: profile.id,
                    auth_adapter_type_id: _.find(authAdapterTypes, {name: profile.provider}).get(k.Attr.Id)
                }
            });

            assert(identity);
        });
    });

    describe('given an existing User with no matching Identity', function() {
        let user;

        beforeEach(async function() {
            user = await User.create({
                email: _.first(profile.emails).value,
                default_study_language_id: _.sample(languages).get(k.Attr.Id),
                interface_language_id: _.sample(languages).get(k.Attr.Id),
                name: profile.displayName
            });

            await User.findOrCreateFromPassportProfile(profile, {locale: 'en'});
        });

        it('should create a new identity with the correct AuthAdapterType', async function() {
            const identity = await Identity.find({
                where: {
                    auth_adapter_type_id: _.find(authAdapterTypes, {name: profile.provider}).get(k.Attr.Id)
                }
            });

            assert(identity);
        });

        it('should create a new identity with the correct auth_adapter_user_id', async function() {
            const identity = await Identity.find({
                where: {
                    auth_adapter_user_id: profile.id
                }
            });

            assert(identity);
        });

        it('should create a new identity linked to the correct User record', async function() {
            const identity = await Identity.find({
                where: {
                    user_id: user.get(k.Attr.Id)
                }
            });

            assert(identity);
        });

        it('should not create an additional User record', async function() {
            assert.equal(await User.count(), 1);
        });
    });

    describe('given an existing User with an existing Identity', function() {
        beforeEach(async function() {
            const user = await User.create({
                email: _.first(profile.emails).value,
                default_study_language_id: _.sample(languages).get(k.Attr.Id),
                interface_language_id: _.sample(languages).get(k.Attr.Id),
                name: profile.displayName
            });

            await Identity.create({
                user_id: user.get(k.Attr.Id),
                auth_adapter_type_id: _.find(authAdapterTypes, {name: profile.provider}).get(k.Attr.Id),
                auth_adapter_user_id: profile.id
            });
        });

        it('should return the existing user data from the database', async function() {
            const user = await User.findOrCreateFromPassportProfile(profile, {locale: 'en'});
            assert(user.get(k.Attr.Id));
        });

        it('should not create an additional User record', async function() {
            assert.equal(await User.count(), 1);
        });

        it('should not create an additional Identity record', async function() {
            assert.equal(await Identity.count(), 1);
        });
    });

    describe('given a profile object', function() {
        it('should throw a ReferenceError if profile.id is missing', async function() {
            const asyncTest = User.findOrCreateFromPassportProfile.bind(null, _.omit(profile, k.Attr.Id), {locale: 'en'});
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a ReferenceError if profile.provider is missing', async function() {
            const asyncTest = User.findOrCreateFromPassportProfile.bind(null, _.omit(profile, 'provider'), {locale: 'en'});
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a ReferenceError if profile.displayName is missing', async function() {
            const asyncTest = User.findOrCreateFromPassportProfile.bind(null, _.omit(profile, 'displayName'), {locale: 'en'});
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });

        it('should throw a ReferenceError if profile.emails is missing', async function() {
            const asyncTest = User.findOrCreateFromPassportProfile.bind(null, _.omit(profile, 'emails'), {locale: 'en'});
            assert(await SpecUtil.throwsAsync(asyncTest, ReferenceError));
        });
    });
});
