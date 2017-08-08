/**
 * index
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/13.
 */

const path = require('path');
const fs   = require('fs');
const _    = require('lodash');

const middleware = {};

fs.readdirSync(__dirname).filter((file) => {
    return !_.startsWith(file, '.') && _.endsWith(file, '.js') && file !== path.basename(module.filename);
}).forEach((file) => {
    let moduleName = _.upperFirst(_.camelCase(file.substring(0, file.length - 3)));
    middleware[moduleName] = require(path.join(__dirname, file));
});

module.exports = middleware;
