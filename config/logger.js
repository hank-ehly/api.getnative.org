/**
 * logger
 * api.getnative.org
 *
 * Created by henryehly on 2017/01/22.
 */

const winston = require('winston');
const k = require('./keys.json');
const moment = require('moment');

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss ZZ'),
            formatter: (options) => {
                return `[${options.timestamp()}][${options.level.toUpperCase()}] ${options.message}`;
            }
        })
    ]
});

function _getConsoleLevel() {
    if (process.env.DEBUG) {
        return 'debug';
    } else if (['production', 'test', 'circle_ci'].includes(process.env.NODE_ENV)) {
        return 'error';
    }
    return 'debug';
}

logger.transports.console.level = _getConsoleLevel();

module.exports = logger;
