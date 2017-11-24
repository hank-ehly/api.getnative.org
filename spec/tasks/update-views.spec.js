// /**
//  * update-views.spec
//  * api.getnativelearning.com
//  *
//  * Created by henryehly on 2017/11/12.
//  */
//
// const SpecUtil = require('../spec-util');
// const m = require('mocha');
// const [describe, it, after] = [m.describe, m.it, m.after];
// const path = require('path');
// const assert = require('assert');
// const fs = require('fs');
// const taskPath = path.resolve(__dirname, '..', '..', 'app', 'tasks', 'update-views.js');
// const logPath = path.resolve(__dirname, '..', 'fixtures', 'access_log');
//
// describe('update video views', function() {
//     it('should return true if the task is successful', async function() {
//         this.timeout(SpecUtil.defaultTimeout);
//
//         let result;
//
//         try {
//             result = await require(taskPath)(logPath);
//             console.log(result);
//         } catch (e) {
//             assert.fail(null, null, e, '');
//         }
//
//         assert.equal(result, true);
//     });
// });
