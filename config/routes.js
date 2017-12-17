/**
 * routes
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const router          = require('express').Router();
const ctrl            = require('../app/controllers');
const pv              = require('./param-validation');
const k               = require('../config/keys.json');
const validate        = require('../app/middleware/validate-request-parameters');
const isAdmin         = require('../app/middleware/is-admin');
const isAuthenticated = require('../app/middleware/is-authenticated');
const parseForm       = require('../app/middleware/form-parser');

const passport        = require('passport');

router.get(    '/oauth/facebook',          passport.authenticate('facebook', {scope: ['public_profile', 'email']}));
router.get(    '/oauth/twitter',           passport.authenticate('twitter',  {scope: ['public_profile', 'email']}));
router.get(    '/oauth/google',            passport.authenticate('google',   {scope: ['profile', 'email']}));
router.get(    '/oauth/facebook/callback', passport.authenticate('facebook', {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get(    '/oauth/twitter/callback',  passport.authenticate('twitter',  {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get(    '/oauth/google/callback',   passport.authenticate('google',   {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);

router.get(    '/categories',                                                                        validate(pv.categories.index),                    passport.authenticate('custom'),                           ctrl.categories.index);
router.post(   '/categories',                                                                        validate(pv.categories.create),                   passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.categories.create);
router.get(    '/categories/:id',                                                                    validate(pv.categories.show),                     passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.categories.show);
router.delete( '/categories/:id',                                                                    validate(pv.categories.delete),                   passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.categories.delete);
router.post(   '/categories/:id/subcategories',                                                      validate(pv.subcategories.create),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.subcategories.create);
router.patch(  '/categories/:category_id/categories_localized/:categories_localized_id',             validate(pv.categoriesLocalized.update),          passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['categories-localized'].update);
router.get(    '/categories/:category_id/subcategories/:subcategory_id',                             validate(pv.subcategories.show),                  passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.subcategories.show);
router.patch(  '/categories/:category_id/subcategories/:subcategory_id',                             validate(pv.subcategories.update),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.subcategories.update);
router.delete( '/categories/:category_id/subcategories/:subcategory_id',                             validate(pv.subcategories.delete),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.subcategories.delete);
router.post(   '/confirm_email',                                                                     validate(pv.auth.confirmRegistrationEmail),                                                                  ctrl.auth.confirmRegistrationEmail);
router.post(   '/confirm_email_update',                                                              validate(pv.auth.confirmEmailUpdate),                                                                        ctrl.auth.confirmEmailUpdate);
router.patch(  '/collocation_occurrences/:id',                                                       validate(pv.collocationOccurrences.update),       passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['collocation-occurrences'].update);
router.get(    '/collocation_occurrences/:id',                                                       validate(pv.collocationOccurrences.show),         passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['collocation-occurrences'].show);
router.post(   '/collocation_occurrences/:id/usage_examples',                                        validate(pv.usageExamples.create),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['usage-examples'].create);
router.get(    '/genders',                                                                           validate(pv.genders.index),                       passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.genders.index);
router.get(    '/healthcheck',                                                                                                                                                                                    ctrl.healthcheck.healthcheck);
router.get(    '/languages',                                                                         validate(pv.languages.index),                     passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.languages.index);
router.post(   '/resend_confirmation_email',                                                         validate(pv.auth.resendRegistrationConfirmationEmail),                                                       ctrl.auth.resendRegistrationConfirmationEmail);
router.post(   '/reset_password',                                                                    validate(pv.auth.resetPassword),                                                                             ctrl.auth.resetPassword);
router.post(   '/send_password_reset_link',                                                          validate(pv.auth.sendPasswordResetLink),                                                                     ctrl.auth.sendPasswordResetLink);
router.post(   '/sessions',                                                                          validate(pv.sessions.create),                                                                                ctrl.sessions.create);
router.post(   '/study',                                                                             validate(pv.study.createStudySession),            passport.authenticate('custom'), isAuthenticated,          ctrl.study.createStudySession);
router.post(   '/study/complete',                                                                    validate(pv.study.complete),                      passport.authenticate('custom'), isAuthenticated,          ctrl.study.complete);
router.get(    '/study/:lang/stats',                                                                 validate(pv.study.stats),                         passport.authenticate('custom'), isAuthenticated,          ctrl.study.stats);
router.get(    '/study/:lang/writing_answers',                                                       validate(pv.study.writing_answers),               passport.authenticate('custom'), isAuthenticated,          ctrl.study.writing_answers);
router.post(   '/study/writing_answers',                                                             validate(pv.study.createWritingAnswer),           passport.authenticate('custom'), isAuthenticated,          ctrl.study.createWritingAnswer);
router.get(    '/speakers',                                                                          validate(pv.speakers.index),                      passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.speakers.index);
router.post(   '/speakers',                                                                          validate(pv.speakers.create),                     passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.speakers.create);
router.get(    '/speakers/:id',                                                                      validate(pv.speakers.show),                       passport.authenticate('custom'), isAuthenticated,          ctrl.speakers.show);
router.patch(  '/speakers/:id',                                                                      validate(pv.speakers.update),                     passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.speakers.update);
router.delete( '/speakers/:id',                                                                      validate(pv.speakers.delete),                     passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.speakers.delete);
router.post(   '/speakers/:id/picture',   parseForm,                                                 validate(pv.speakers.picture),                    passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.speakers.picture);
router.get(    '/speakers/:id/speakers_localized',                                                   validate(pv.speakersLocalized.show),              passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['speakers-localized'].show);
router.patch(  '/subcategories/:subcategory_id/subcategories_localized/:subcategories_localized_id', validate(pv.subcategoriesLocalized.update),       passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['subcategories-localized'].update);
router.patch(  '/usage_examples/:id',                                                                validate(pv.usageExamples.update),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['usage-examples'].update);
router.delete( '/usage_examples/:id',                                                                validate(pv.usageExamples.delete),                passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['usage-examples'].delete);
router.post(   '/users',                                                                             validate(pv.users.create),                                                                                   ctrl.users.create);
router.patch(  '/users',                                                                             validate(pv.users.update),                        passport.authenticate('custom'), isAuthenticated,          ctrl.users.update);
router.delete( '/users',                                                                             validate(pv.users.delete),                        passport.authenticate('custom'), isAuthenticated,          ctrl.users.delete);
router.post(   '/users/profile_image',    parseForm,                                                 validate(pv.users.profileImage),                  passport.authenticate('custom'), isAuthenticated,          ctrl.users.profileImage);
router.delete( '/users/profile_image',                                                               validate(pv.users.deleteProfileImage),            passport.authenticate('custom'), isAuthenticated,          ctrl.users.deleteProfileImage);
router.post(   '/users/password',                                                                    validate(pv.users.updatePassword),                passport.authenticate('custom'), isAuthenticated,          ctrl.users.updatePassword);
router.post(   '/users/:id/email',                                                                   validate(pv.auth.sendEmailUpdateConfirmationEmail),passport.authenticate('custom'),isAuthenticated,          ctrl.auth.sendEmailUpdateConfirmationEmail);
router.get(    '/users/me',                                                                          validate(pv.users.me),                            passport.authenticate('custom'), isAuthenticated,          ctrl.users.show);
router.get(    '/videos/:id/writing_questions',                                                      validate(pv.writingQuestions.index),              passport.authenticate('custom'), isAuthenticated,          ctrl['writing-questions'].index);
router.get(    '/videos',                                                                            validate(pv.videos.index),                        passport.authenticate('custom'),                           ctrl.videos.index);
router.post(   '/videos',                                                                            validate(pv.videos.create),                       passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl.videos.create);
router.get(    '/videos/:id',                                                                        validate(pv.videos.show),                         passport.authenticate('custom'),                           ctrl.videos.show);
router.patch(  '/videos/:id',                                                                        validate(pv.videos.update),                       passport.authenticate('custom'), isAuthenticated,          ctrl.videos.update);
router.get(    '/videos/:id/collocation_occurrences',                                                validate(pv.collocationOccurrences.index),        passport.authenticate('custom'), isAuthenticated, isAdmin, ctrl['collocation-occurrences'].index);
router.post(   '/videos/:id/dequeue',                                                                validate(pv.videos.dequeue),                      passport.authenticate('custom'), isAuthenticated,          ctrl.videos.dequeue);
router.post(   '/videos/:id/like',                                                                   validate(pv.videos.like),                         passport.authenticate('custom'), isAuthenticated,          ctrl.videos.like);
router.post(   '/videos/:id/queue',                                                                  validate(pv.videos.queue),                        passport.authenticate('custom'), isAuthenticated,          ctrl.videos.queue);
router.post(   '/videos/:id/unlike',                                                                 validate(pv.videos.unlike),                       passport.authenticate('custom'), isAuthenticated,          ctrl.videos.unlike);

module.exports = router;
