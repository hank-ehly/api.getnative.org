/**
 * index
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const path = require('path');
const fs   = require('fs');
const _    = require('lodash');

const controllers = {};

fs.readdirSync(__dirname).filter((file) => {
    return !_.startsWith(file, '.') && _.endsWith(file, '.js') && file !== path.basename(module.filename);
}).forEach((file) => {
    const moduleName = file.substring(0, file.length - 3);
    const modulePath = path.join(__dirname, file);
    controllers[moduleName] = require(modulePath);
});

module.exports = controllers;
