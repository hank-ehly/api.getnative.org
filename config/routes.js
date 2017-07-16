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
const validateParams = require('../app/middleware/validate-request-parameters');
const auth           = require('../app/middleware/authenticate');
const adminOnly      = require('../app/middleware/admin-only');
const parseForm      = require('../app/middleware/form-parser');

const passport       = require('passport');

router.get(    '/oauth/facebook',          passport.authenticate('facebook', {scope: ['public_profile', 'email']}));
router.get(    '/oauth/twitter',           passport.authenticate('twitter',  {scope: ['public_profile', 'email']}));
router.get(    '/oauth/google',            passport.authenticate('google',   {scope: ['profile', 'email']}));
router.get(    '/oauth/facebook/callback', passport.authenticate('facebook', {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get(    '/oauth/twitter/callback',  passport.authenticate('twitter',  {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get(    '/oauth/google/callback',   passport.authenticate('google',   {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);

router.get(    '/categories',                                                                        validateParams(pv.categories.index),                    auth,            ctrl.categories.index);
router.post(   '/categories',                                                                        validateParams(pv.categories.create),                   auth, adminOnly, ctrl.categories.create);
router.get(    '/categories/:id',                                                                    validateParams(pv.categories.show),                     auth, adminOnly, ctrl.categories.show);
router.delete( '/categories/:id',                                                                    validateParams(pv.categories.delete),                   auth, adminOnly, ctrl.categories.delete);
router.post(   '/categories/:id/subcategories',                                                      validateParams(pv.subcategories.create),                auth, adminOnly, ctrl.subcategories.create);
router.patch(  '/categories/:category_id/categories_localized/:categories_localized_id',             validateParams(pv.categoriesLocalized.update),          auth, adminOnly, ctrl['categories-localized'].update);
router.get(    '/categories/:category_id/subcategories/:subcategory_id',                             validateParams(pv.subcategories.show),                  auth, adminOnly, ctrl.subcategories.show);
router.patch(  '/categories/:category_id/subcategories/:subcategory_id',                             validateParams(pv.subcategories.update),                auth, adminOnly, ctrl.subcategories.update);
router.delete( '/categories/:category_id/subcategories/:subcategory_id',                             validateParams(pv.subcategories.delete),                auth, adminOnly, ctrl.subcategories.delete);
router.post(   '/confirm_email',                                                                     validateParams(pv.auth.confirmEmail),                                    ctrl.auth.confirmEmail);
router.patch(  '/collocation_occurrences/:id',                                                       validateParams(pv.collocationOccurrences.update),       auth, adminOnly, ctrl['collocation-occurrences'].update);
router.get(    '/collocation_occurrences/:id',                                                       validateParams(pv.collocationOccurrences.show),         auth, adminOnly, ctrl['collocation-occurrences'].show);
router.post(   '/collocation_occurrences/:id/usage_examples',                                        validateParams(pv.usageExamples.create),                auth, adminOnly, ctrl['usage-examples'].create);
router.get(    '/genders',                                                                           validateParams(pv.genders.index),                       auth, adminOnly, ctrl.genders.index);
router.get(    '/languages',                                                                         validateParams(pv.languages.index),                     auth, adminOnly, ctrl.languages.index);
router.post(   '/resend_confirmation_email',                                                         validateParams(pv.auth.resendConfirmationEmail),                         ctrl.auth.resendConfirmationEmail);
router.post(   '/sessions',                                                                          validateParams(pv.sessions.create),                                      ctrl.sessions.create);
router.post(   '/study',                                                                             validateParams(pv.study.createStudySession),            auth,            ctrl.study.createStudySession);
router.post(   '/study/complete',                                                                    validateParams(pv.study.complete),                      auth,            ctrl.study.complete);
router.get(    '/study/:lang/stats',                                                                 validateParams(pv.study.stats),                         auth,            ctrl.study.stats);
router.get(    '/study/:lang/writing_answers',                                                       validateParams(pv.study.writing_answers),               auth,            ctrl.study.writing_answers);
router.post(   '/study/writing_answers',                                                             validateParams(pv.study.createWritingAnswer),           auth,            ctrl.study.createWritingAnswer);
router.get(    '/speakers',                                                                          validateParams(pv.speakers.index),                      auth, adminOnly, ctrl.speakers.index);
router.post(   '/speakers',                                                                          validateParams(pv.speakers.create),                     auth, adminOnly, ctrl.speakers.create);
router.get(    '/speakers/:id',                                                                      validateParams(pv.speakers.show),                       auth,            ctrl.speakers.show);
router.patch(  '/speakers/:id',                                                                      validateParams(pv.speakers.update),                     auth, adminOnly, ctrl.speakers.update);
router.delete( '/speakers/:id',                                                                      validateParams(pv.speakers.delete),                     auth, adminOnly, ctrl.speakers.delete);
router.post(   '/speakers/:id/picture',   parseForm,                                                 validateParams(pv.speakers.picture),                    auth, adminOnly, ctrl.speakers.picture);
router.get(    '/speakers/:id/speakers_localized',                                                   validateParams(pv.speakersLocalized.show),              auth, adminOnly, ctrl['speakers-localized'].show);
router.patch(  '/subcategories/:subcategory_id/subcategories_localized/:subcategories_localized_id', validateParams(pv.subcategoriesLocalized.update),       auth, adminOnly, ctrl['subcategories-localized'].update);
router.patch(  '/usage_examples/:id',                                                                validateParams(pv.usageExamples.update),                auth, adminOnly, ctrl['usage-examples'].update);
router.delete( '/usage_examples/:id',                                                                validateParams(pv.usageExamples.delete),                auth, adminOnly, ctrl['usage-examples'].delete);
router.post(   '/users',                                                                             validateParams(pv.users.create),                                         ctrl.users.create);
router.patch(  '/users',                                                                             validateParams(pv.users.update),                        auth,            ctrl.users.update);
router.post(   '/users/password',                                                                    validateParams(pv.users.updatePassword),                auth,            ctrl.users.updatePassword);
router.post(   '/users/email',                                                                       validateParams(pv.users.updateEmail),                   auth,            ctrl.users.updateEmail);
router.get(    '/users/me',                                                                          validateParams(pv.users.me),                            auth,            ctrl.users.show);
router.get(    '/videos/:id/writing_questions',                                                      validateParams(pv.writingQuestions.index),              auth,            ctrl['writing-questions'].index);
router.get(    '/videos',                                                                            validateParams(pv.videos.index),                        auth,            ctrl.videos.index);
router.post(   '/videos',                                                                            validateParams(pv.videos.create),                       auth, adminOnly, ctrl.videos.create);
router.get(    '/videos/:id',                                                                        validateParams(pv.videos.show),                         auth,            ctrl.videos.show);
router.patch(  '/videos/:id',                                                                        validateParams(pv.videos.update),                       auth,            ctrl.videos.update);
router.post(   '/videos/:id/upload',      parseForm,                                                 validateParams(pv.videos.upload),                       auth,            ctrl.videos.upload);
router.get(    '/videos/:id/videos_localized',                                                       validateParams(pv.videos.videosLocalized),              auth, adminOnly, ctrl.videos.videosLocalized);
router.get(    '/videos/:id/collocation_occurrences',                                                validateParams(pv.videos.collocationOccurrences.index), auth, adminOnly, ctrl.videos.collocationOccurrences.index);
router.post(   '/videos/:id/dequeue',                                                                validateParams(pv.videos.dequeue),                      auth,            ctrl.videos.dequeue);
router.post(   '/videos/:id/like',                                                                   validateParams(pv.videos.like),                         auth,            ctrl.videos.like);
router.post(   '/videos/:id/queue',                                                                  validateParams(pv.videos.queue),                        auth,            ctrl.videos.queue);
router.post(   '/videos/:id/unlike',                                                                 validateParams(pv.videos.unlike),                       auth,            ctrl.videos.unlike);
router.post(   '/videos/transcribe',      parseForm,                                                 validateParams(pv.videos.transcribe),                   auth, adminOnly, ctrl.videos.transcribe);

module.exports = router;
