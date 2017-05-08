/**
 * index
 * get-native.com
 *
 * Created by henryehly on 2017/03/14.
 */

const path = require('path');
const fs   = require('fs');
const _    = require('lodash');

const services = {};

fs.readdirSync(__dirname).filter(file => {
    return !_.startsWith(file, '.') && _.endsWith(file, '.js') && file !== path.basename(module.filename);
}).forEach(file => {
    let moduleName = _.upperFirst(_.camelCase(file.substring(0, file.length - 3)));
    services[moduleName] = require(path.join(__dirname, file));
});

module.exports = services;
