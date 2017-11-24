// /**
//  * clean.spec
//  * api.getnativelearning.com
//  *
//  * Created by henryehly on 2017/05/06.
//  */
//
// const SpecUtil = require('../../spec-util');
// const db = require('../../../app/models');
// const k = require('../../../config/keys.json');
// const VerificationToken = db[k.Model.VerificationToken];
// const User = db[k.Model.User];
// const Auth = require('../../../app/services')['Auth'];
//
// const m = require('mocha');
// const [describe, it, beforeEach] = [m.describe, m.it, m.beforeEach];
// const assert = require('assert');
// const moment = require('moment');
// const util = require('util');
// const execFile = util.promisify(require('child_process').execFile);
// const path = require('path');
// const _ = require('lodash');
//
// const taskPath = path.resolve(__dirname, '..', '..', '..', 'app', 'tasks', 'verification-tokens', 'clean.js');
// const nowFmt = moment().format("YYYY-MM-DD HH:mm:ss");
//
// describe('clean (VerificationToken)', function() {
//     beforeEach(function() {
//         this.timeout(SpecUtil.defaultTimeout);
//         return SpecUtil.seedAll();
//     });
//
//     it(`should delete all VerificationToken records whose expiration date is equal to or before the current time`, async function() {
//         this.timeout(SpecUtil.defaultTimeout);
//
//         const query = `
//             SELECT COUNT(*) AS count
//             FROM verification_tokens
//             WHERE expiration_date <= ?;
//         `;
//
//         try {
//             await require(taskPath)();
//         } catch (e) {
//             assert.fail(null, null, e, '');
//         }
//
//         const results = await db.sequelize.query(query, {replacements: [nowFmt]});
//         const count = _.first(_.flatten(results))['count'];
//
//         assert.equal(count, 0);
//     });
//
//     it(`should not delete VerificationToken records whose expiration date is in the future`, async function() {
//         this.timeout(SpecUtil.defaultTimeout);
//
//         const user = await User.find({attributes: [k.Attr.Id]});
//         const userId = user.get(k.Attr.Id);
//
//         await VerificationToken.create({
//             user_id: userId,
//             token: Auth.generateRandomHash(),
//             expiration_date: moment().add(1, 'days').toDate()
//         });
//
//         const query = `
//             SELECT COUNT(*) AS count
//             FROM verification_tokens
//             WHERE expiration_date > ?;
//         `;
//
//         try {
//             await require(taskPath)();
//         } catch (e) {
//             assert.fail(null, null, e, '');
//         }
//
//         const results = await db.sequelize.query(query, {replacements: [nowFmt]});
//         const count = _.first(_.flatten(results))['count'];
//
//         assert.notEqual(count, 0);
//     });
//
//     it('should delete VerificationTokens with dependencies', async function() {
//         this.timeout(SpecUtil.defaultTimeout);
//
//         const user = await User.find({attributes: [k.Attr.Id]});
//         const userId = user.get(k.Attr.Id);
//
//         const vt = await VerificationToken.create({
//             user_id: userId,
//             token: Auth.generateRandomHash(),
//             expiration_date: moment().subtract(1, 'days').toDate()
//         });
//
//         const emailChangeRequest = await db[k.Model.EmailChangeRequest].create({
//             email: 'foo@bar.com',
//             verification_token_id: vt.get(k.Attr.Id)
//         });
//
//         try {
//             await require(taskPath)();
//         } catch (e) {
//             assert.fail(null, null, e, '');
//         }
//
//         const deletedEmailChangeRequest = await db[k.Model.EmailChangeRequest].findByPrimary(emailChangeRequest.get(k.Attr.Id));
//
//         assert(!deletedEmailChangeRequest);
//     });
//
//     it('should return true if the task is successful', async function() {
//         this.timeout(SpecUtil.defaultTimeout);
//
//         let result;
//
//         try {
//             result = await require(taskPath)();
//         } catch (e) {
//             assert.fail(null, null, e, '');
//         }
//
//         assert.equal(result, true);
//     });
// });
