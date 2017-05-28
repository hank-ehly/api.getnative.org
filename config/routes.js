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

const passport       = require('passport');

router.post('/sessions', ValidateParams(pv.sessions.create), ctrl.sessions.create);
router.post('/users', ValidateParams(pv.users.create), ctrl.users.create);

// todo: Combine with /users/password
router.patch('/users', ValidateParams(pv.users.update),  Authenticate, ctrl.users.update);

// todo: Document
// todo: Combine
router.get('/oauth/facebook',                passport.authenticate('facebook',                {scope: ['public_profile', 'email']}));
router.get('/oauth/twitter',                 passport.authenticate('twitter',                 {scope: ['public_profile', 'email']}));
router.get('/oauth/google',                  passport.authenticate('google',                  {scope: ['profile', 'email']}));
router.get('/oauth/facebook/callback',       passport.authenticate('facebook',                {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get('/oauth/twitter/callback',        passport.authenticate('twitter',                 {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);
router.get('/oauth/google/callback',         passport.authenticate('google',                  {failureRedirect: k.Client.BaseURI}), ctrl.oauth.callback);

// todo: Rest-ify
router.post( '/users/password',              ValidateParams(pv.users.updatePassword),          Authenticate, ctrl.users.updatePassword);
router.post( '/users/email',                 ValidateParams(pv.users.updateEmail),             Authenticate, ctrl.users.updateEmail);
router.get(  '/users/me',                    ValidateParams(pv.users.me),                      Authenticate, ctrl.users.show);
router.get(  '/categories',                  ValidateParams(pv.categories.index),              Authenticate, ctrl.categories.index);
router.post( '/confirm_email',               ValidateParams(pv.auth.confirmEmail),                           ctrl.auth.confirmEmail);
router.post( '/resend_confirmation_email',   ValidateParams(pv.auth.resendConfirmationEmail),                ctrl.auth.resendConfirmationEmail);
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

// Authenticate provides the req.user. For endpoints requiring admin permissions, check the user role
// * You may wish to join the user role table to the user table when creating req.user
router.post( '/videos/transcribe', ValidateParams(pv.videos.transcribe), Authenticate, AdminOnly, ctrl.videos.transcribe);

module.exports = router;
