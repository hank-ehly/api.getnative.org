/**
 * i18n
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/19.
 */

const logger = require('./logger');

const i18n   = require('i18n');
const path   = require('path');

i18n.configure({
    locales: ['en', 'ja'],
    fallbacks: {'ja': 'en'},
    defaultLocale: 'en',
    directory: path.resolve(__dirname, 'locales'),
    objectNotation: true,
    logDebugFn: logger.info,
    logWarnFn: logger.warn,
    logErrorFn: logger.error,
    updateFiles: false
});

module.exports = i18n;
