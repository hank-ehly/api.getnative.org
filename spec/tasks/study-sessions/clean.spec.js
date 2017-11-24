// /**
//  * clean-study-sessions.spec
//  * api.getnativelearning.com
//  *
//  * Created by henryehly on 2017/05/06.
//  */
//
// const SpecUtil = require('../../spec-util');
// const db = require('../../../app/models');
//
// const m = require('mocha');
// const [describe, it, beforeEach] = [m.describe, m.it, m.beforeEach];
// const assert = require('assert');
// const moment = require('moment');
// const path = require('path');
// const _ = require('lodash');
//
// const yesterday = moment().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
// const taskPath = path.resolve(__dirname, '..', '..', '..', 'app', 'tasks', 'study-sessions', 'clean.js');
//
// describe('clean (StudySession)', function() {
//     describe('run', function() {
//         beforeEach(function() {
//             this.timeout(SpecUtil.defaultTimeout);
//             return SpecUtil.seedAll();
//         });
//
//         it(`should remove all StudySession records where 'is_completed' is false and more than 24 has passed since 'created_at'`, async function() {
//             this.timeout(SpecUtil.defaultTimeout);
//
//             try {
//                 await require(taskPath)();
//             } catch (e) {
//                 assert.fail(null, null, e, '');
//             }
//
//             const q = `
//             SELECT COUNT(*) AS count
//             FROM study_sessions
//             WHERE is_completed = false AND created_at < ?;
//         `;
//
//             const result = await db.sequelize.query(q, {replacements: [yesterday]});
//             const count = _.first(_.flatten(result))['count'];
//
//             assert.equal(count, 0);
//         });
//
//         it(`should not remove a StudySession record whose 'is_completed' is false if 'created_at' is less than 24 ago`, async function() {
//             this.timeout(SpecUtil.defaultTimeout);
//
//             const q = `
//             SELECT COUNT(*) AS count
//             FROM study_sessions
//             WHERE is_completed = false AND created_at > ?;
//         `;
//
//             const r1 = await db.sequelize.query(q, {replacements: [yesterday]});
//             const c1 = _.first(_.flatten(r1)).count;
//
//             try {
//                 await require(taskPath)();
//             } catch (e) {
//                 assert.fail(null, null, e, '');
//             }
//
//             const r2 = await db.sequelize.query(q, {replacements: [yesterday]});
//             const c2 = _.first(_.flatten(r2))['count'];
//
//             assert.equal(c1, c2);
//         });
//
//         it('should return true if the task is successful', async function() {
//             this.timeout(SpecUtil.defaultTimeout);
//
//             let result;
//
//             try {
//                 result = await require(taskPath)();
//             } catch (e) {
//                 assert.fail(null, null, e, '');
//             }
//
//             assert.equal(result, true);
//         });
//     });
// });
