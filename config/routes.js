/**
 * routes
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const ctrl     = require('../app/controllers');
const router   = require('express').Router();
const pv       = require('./param-validation');

const middleware     = require('../app/middleware');
const ValidateParams = middleware['ValidateRequestParameters'];
const SetUserId   = middleware['SetUserId'];
const Authenticate   = ctrl.auth.authenticate;

router.post('/sessions', ValidateParams(pv.sessions.create), ctrl.sessions.create);
router.post('/users', ValidateParams(pv.users.create), ctrl.users.create);

router.patch('/users',                     ValidateParams(pv.users.update),              SetUserId, Authenticate, ctrl.users.update);
router.post( '/users/password',            ValidateParams(pv.users.updatePassword),      SetUserId, Authenticate, ctrl.users.updatePassword);
router.post( '/users/email',               ValidateParams(pv.users.updateEmail),         SetUserId, Authenticate, ctrl.users.updateEmail);
router.get(  '/categories',                  ValidateParams(pv.categories.index),             SetUserId, Authenticate, ctrl.categories.index);
router.post( '/confirm_email',               ValidateParams(pv.auth.confirmEmail),                                        ctrl.auth.confirmEmail);
router.post( '/resend_confirmation_email',   ValidateParams(pv.auth.resendConfirmationEmail),                             ctrl.auth.resendConfirmationEmail);
router.post( '/study',                       ValidateParams(pv.study.createStudySession),     SetUserId, Authenticate, ctrl.study.createStudySession);
router.post( '/study/complete',              ValidateParams(pv.study.complete),               SetUserId, Authenticate, ctrl.study.complete);
router.get(  '/study/:lang/stats',           ValidateParams(pv.study.stats),                  SetUserId, Authenticate, ctrl.study.stats);
router.get(  '/study/:lang/writing_answers', ValidateParams(pv.study.writing_answers),        SetUserId, Authenticate, ctrl.study.writing_answers);
router.post( '/study/writing_answers',       ValidateParams(pv.study.createWritingAnswer),    SetUserId, Authenticate, ctrl.study.createWritingAnswer);
router.get(  '/speakers/:id',                ValidateParams(pv.speakers.show),                SetUserId, Authenticate, ctrl.speakers.show);
router.get(  '/subcategories/:id/writing_questions', ValidateParams(pv.subcategories.writing_questions),    Authenticate, ctrl.subcategories.writingQuestions);
router.get(  '/videos',                      ValidateParams(pv.videos.index),                 SetUserId, Authenticate, ctrl.videos.index);
router.get(  '/videos/:id',                  ValidateParams(pv.videos.show),                  SetUserId, Authenticate, ctrl.videos.show);
router.post( '/videos/:id/dequeue',          ValidateParams(pv.videos.dequeue),               SetUserId, Authenticate, ctrl.videos.dequeue);
router.post( '/videos/:id/like',             ValidateParams(pv.videos.like),                  SetUserId, Authenticate, ctrl.videos.like);
router.post( '/videos/:id/queue',            ValidateParams(pv.videos.queue),                 SetUserId, Authenticate, ctrl.videos.queue);
router.post( '/videos/:id/unlike',           ValidateParams(pv.videos.unlike),                SetUserId, Authenticate, ctrl.videos.unlike);

module.exports = router;
