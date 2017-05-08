/**
 * utility
 * get-native.com
 *
 * Created by henryehly on 2017/03/14.
 */

const moment = require('moment');
const _      = require('lodash');

module.exports.extractAuthTokenFromRequest = function(req) {
    if (arguments.length !== 1) {
        throw new RangeError(`Invalid number of arguments: ${arguments.length}`);
    }

    if (!req.hasOwnProperty('headers') || !_.isPlainObject(req.headers)) {
        throw new TypeError(`req.headers is either missing or has an invalid type`);
    }

    if (!req.headers.hasOwnProperty('authorization') || !_.isString(req.headers.authorization)) {
        throw new ReferenceError(`req.headers.authorization does not exist or has an invalid type`);
    }

    const authHeaderComponents = req.headers.authorization.split(' ');

    if (authHeaderComponents.length !== 2) {
        throw new SyntaxError(`Authorization header is formatted incorrectly: ${req.headers.authorization}`);
    }

    return _.nth(authHeaderComponents, 1);
};

module.exports.browserTimezoneOffsetToSQLFormat = function(offsetInMinutes) {
    if (!offsetInMinutes) {
        return '+00:00';
    }

    // The offset is positive if the local timezone is behind UTC and negative if it is ahead
    const minutes = -parseInt(offsetInMinutes);
    const hours   = minutes / 60;

    const wholeHours    = Math[hours > 0 ? 'floor' : 'ceil'](hours);
    const absoluteHours = Math.abs(wholeHours);

    const wholeMinutes    = (hours % 1) * 60;
    const absoluteMinutes = Math.abs(wholeMinutes);

    const symbol        = hours >= 0 ? '+' : '-';
    const paddedHours   = _.padStart(absoluteHours, 2, '0');
    const paddedMinutes = _.padStart(absoluteMinutes, 2, '0');

    return [symbol, paddedHours, ':', paddedMinutes].join('');
};

module.exports.tomorrow = function() {
    return moment().add(1, 'days').toDate();
};
