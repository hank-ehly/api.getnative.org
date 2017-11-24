// /**
//  * backup-db.spec
//  * api.getnativelearning.com
//  *
//  * Created by henryehly on 2017/10/07.
//  */
//
// const SpecUtil = require('../spec-util');
// const m = require('mocha');
// const [describe, it, after] = [m.describe, m.it, m.after];
// const path = require('path');
// const assert = require('assert');
// const fs = require('fs');
// const taskPath = path.resolve(__dirname, '..', '..', 'app', 'tasks', 'backup-db.js');
//
// describe('backup-db', function() {
//     describe('run', function() {
//         it('should output a file and return a Promise that resolves to the output file path', async function() {
//             let outPath;
//
//             after(function() {
//                 if (outPath) {
//                     fs.unlinkSync(outPath);
//                 }
//             });
//
//             this.timeout(SpecUtil.defaultTimeout);
//
//             try {
//                 outPath = await require(taskPath)();
//             } catch (e) {
//                 assert.fail(null, null, e, '');
//             }
//
//             assert(fs.existsSync(outPath));
//         });
//     });
// });
