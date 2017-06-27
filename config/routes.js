/**
 * routes
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const router         = require('express').Router();
const ctrl           = require('../app/controllers');
const pv             = require('./param-validation');
const k              = require('../config/keys.json');
const middleware     = require('../app/middleware');
const ValidateParams = middleware['ValidateRequestParameters'];
const Authenticate   = middleware['Authenticate'];
const AdminOnly      = middleware['AdminOnly'];
const FormParser     = middleware['FormParser'];
const ExtractMetadata = middleware['ExtractJsonMetadata'];

const passport       = require('passport');

router.post('/sessions', ValidateParams(pv.sessions.create), ctrl.sessions.create);
router.post('/users', ValidateParams(pv.users.create), ctrl.users.create);

// todo: Combine with /users/password
router.patch('/users', ValidateParams(pv.users.update),  Authenticate, ctrl.users.update);

router.get('/oauth/facebook',                passport.authenticate('facebook',                {scope: ['public_profile', 'email']}));
router.get('/oauth/twitter',                 passport.authenticate('twitter',                 {scope: ['public_profile', 'email']}));
router.get('/oauth/google',                  passport.authenticate('google',                  {scope: ['profile', 'email']}));
router.get('/oauth/facebook/callback',       passport.authenticate('facebook',                {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get('/oauth/twitter/callback',        passport.authenticate('twitter',                 {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get('/oauth/google/callback',         passport.authenticate('google',                  {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.post( '/users/password',              ValidateParams(pv.users.updatePassword),          Authenticate, ctrl.users.updatePassword);
router.post( '/users/email',                 ValidateParams(pv.users.updateEmail),             Authenticate, ctrl.users.updateEmail);
router.get(  '/users/me',                    ValidateParams(pv.users.me),                      Authenticate, ctrl.users.show);
router.get(  '/categories',                  ValidateParams(pv.categories.index),              Authenticate, ctrl.categories.index);
router.post( '/categories',                  ValidateParams(pv.categories.create),             Authenticate, AdminOnly, ctrl.categories.create);
router.get(  '/categories/:id',              ValidateParams(pv.categories.show),               Authenticate, AdminOnly, ctrl.categories.show);
router.delete('/categories/:id',             ValidateParams(pv.categories.delete),             Authenticate, AdminOnly, ctrl.categories.delete);
router.post( '/categories/:id/subcategories',ValidateParams(pv.subcategories.create),          Authenticate, AdminOnly, ctrl.subcategories.create);
router.patch('/categories/:category_id/categories_localized/:categories_localized_id', ValidateParams(pv.categoriesLocalized.update), Authenticate, AdminOnly, ctrl['categories-localized'].update);
router.get(  '/categories/:category_id/subcategories/:subcategory_id', ValidateParams(pv.subcategories.show), Authenticate, AdminOnly, ctrl.subcategories.show);
router.patch('/categories/:category_id/subcategories/:subcategory_id', ValidateParams(pv.subcategories.update), Authenticate, AdminOnly, ctrl.subcategories.update);
router.delete('/categories/:category_id/subcategories/:subcategory_id',ValidateParams(pv.subcategories.delete), Authenticate, AdminOnly, ctrl.subcategories.delete);
router.post( '/confirm_email',               ValidateParams(pv.auth.confirmEmail),                           ctrl.auth.confirmEmail);
router.get(  '/languages',                   ValidateParams(pv.languages.index),               Authenticate, AdminOnly, ctrl.languages.index);
router.post( '/resend_confirmation_email',   ValidateParams(pv.auth.resendConfirmationEmail),                ctrl.auth.resendConfirmationEmail);
router.post( '/study',                       ValidateParams(pv.study.createStudySession),      Authenticate, ctrl.study.createStudySession);
router.post( '/study/complete',              ValidateParams(pv.study.complete),                Authenticate, ctrl.study.complete);
router.get(  '/study/:lang/stats',           ValidateParams(pv.study.stats),                   Authenticate, ctrl.study.stats);
router.get(  '/study/:lang/writing_answers', ValidateParams(pv.study.writing_answers),         Authenticate, ctrl.study.writing_answers);
router.post( '/study/writing_answers',       ValidateParams(pv.study.createWritingAnswer),     Authenticate, ctrl.study.createWritingAnswer);
router.get(  '/speakers/:id',                ValidateParams(pv.speakers.show),                 Authenticate, ctrl.speakers.show);
router.patch('/subcategories/:subcategory_id/subcategories_localized/:subcategories_localized_id', ValidateParams(pv.subcategoriesLocalized.update), Authenticate, AdminOnly, ctrl['subcategories-localized'].update);
router.get(  '/videos/:id/writing_questions',ValidateParams(pv.writingQuestions.index),        Authenticate, ctrl['writing-questions'].index);
router.get(  '/videos',                      ValidateParams(pv.videos.index),                  Authenticate, ctrl.videos.index);
router.post( '/videos', FormParser, ExtractMetadata, ValidateParams(pv.videos.create),     Authenticate, AdminOnly, ctrl.videos.create);
router.get(  '/videos/:id',                  ValidateParams(pv.videos.show),                   Authenticate, ctrl.videos.show);
router.post( '/videos/:id/dequeue',          ValidateParams(pv.videos.dequeue),                Authenticate, ctrl.videos.dequeue);
router.post( '/videos/:id/like',             ValidateParams(pv.videos.like),                   Authenticate, ctrl.videos.like);
router.post( '/videos/:id/queue',            ValidateParams(pv.videos.queue),                  Authenticate, ctrl.videos.queue);
router.post( '/videos/:id/unlike',           ValidateParams(pv.videos.unlike),                 Authenticate, ctrl.videos.unlike);
router.post( '/videos/transcribe', FormParser, ValidateParams(pv.videos.transcribe),           Authenticate, AdminOnly, ctrl.videos.transcribe);

module.exports = router;
