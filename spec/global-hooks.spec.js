/**
 * global.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/28.
 */

const SpecUtil = require('./spec-util');

const mocha = require('mocha');
const [before, after] = [mocha.before, mocha.after];

before(function() {
    return SpecUtil.startMailServer();
});

after(function() {
    return SpecUtil.stopMailServer();
});
