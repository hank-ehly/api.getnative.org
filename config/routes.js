/**
 * routes
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const ctrl = require('../app/controllers');
const router = require('express').Router();
const pv = require('./param-validation');

const middleware = require('../app/middleware');
const passport = require('passport');
const ValidateParams = middleware['ValidateRequestParameters'];
const Authenticate = middleware['Authenticate'];

router.post('/sessions', ValidateParams(pv.sessions.create), ctrl.sessions.create);
router.post('/users', ValidateParams(pv.users.create), ctrl.users.create);

// todo: Combine with /users/password
router.patch('/users', ValidateParams(pv.users.update),  Authenticate, ctrl.users.update);

// todo: Document
router.get('/oauth/facebook',          passport.authenticate('facebook', {scope: ['public_profile']}));
router.get('/oauth/facebook/callback', passport.authenticate('facebook', {failureRedirect: 'https://hankehly.com'}), ctrl.oauth.facebookCallback);

// todo: Rest-ify all
router.post( '/users/password',              ValidateParams(pv.users.updatePassword),          Authenticate, ctrl.users.updatePassword);
router.post( '/users/email',                 ValidateParams(pv.users.updateEmail),             Authenticate, ctrl.users.updateEmail);

router.get(  '/categories',                  ValidateParams(pv.categories.index),              Authenticate, ctrl.categories.index);

router.post( '/confirm_email',               ValidateParams(pv.auth.confirmEmail),                                     ctrl.auth.confirmEmail);
router.post( '/resend_confirmation_email',   ValidateParams(pv.auth.resendConfirmationEmail),                          ctrl.auth.resendConfirmationEmail);
router.post( '/study',                       ValidateParams(pv.study.createStudySession),      Authenticate, ctrl.study.createStudySession);
router.post( '/study/complete',              ValidateParams(pv.study.complete),                Authenticate, ctrl.study.complete);
router.get(  '/study/:lang/stats',           ValidateParams(pv.study.stats),                   Authenticate, ctrl.study.stats);
router.get(  '/study/:lang/writing_answers', ValidateParams(pv.study.writing_answers),         Authenticate, ctrl.study.writing_answers);
router.post( '/study/writing_answers',       ValidateParams(pv.study.createWritingAnswer),     Authenticate, ctrl.study.createWritingAnswer);
router.get(  '/speakers/:id',                ValidateParams(pv.speakers.show),                 Authenticate, ctrl.speakers.show);
router.get(  '/subcategories/:id/writing_questions', ValidateParams(pv.subcategories.writing_questions), Authenticate, ctrl.subcategories.writingQuestions);
router.get(  '/videos',                      ValidateParams(pv.videos.index),                  Authenticate, ctrl.videos.index);
router.get(  '/videos/:id',                  ValidateParams(pv.videos.show),                   Authenticate, ctrl.videos.show);
router.post( '/videos/:id/dequeue',          ValidateParams(pv.videos.dequeue),                Authenticate, ctrl.videos.dequeue);
router.post( '/videos/:id/like',             ValidateParams(pv.videos.like),                   Authenticate, ctrl.videos.like);
router.post( '/videos/:id/queue',            ValidateParams(pv.videos.queue),                  Authenticate, ctrl.videos.queue);
router.post( '/videos/:id/unlike',           ValidateParams(pv.videos.unlike),                 Authenticate, ctrl.videos.unlike);

module.exports = router;
