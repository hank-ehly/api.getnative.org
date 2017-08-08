/**
 * utility
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/14.
 */

const Hashids = require('hashids');
const moment  = require('moment');
const _       = require('lodash');

const hashids = new Hashids('', 11);

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
    const hours = minutes / 60;

    const wholeHours = Math[hours > 0 ? 'floor' : 'ceil'](hours);
    const absoluteHours = Math.abs(wholeHours);

    const wholeMinutes = (hours % 1) * 60;
    const absoluteMinutes = Math.abs(wholeMinutes);

    const symbol = hours >= 0 ? '+' : '-';
    const paddedHours = _.padStart(absoluteHours, 2, '0');
    const paddedMinutes = _.padStart(absoluteMinutes, 2, '0');

    return [symbol, paddedHours, ':', paddedMinutes].join('');
};

module.exports.tomorrow = function() {
    return moment().add(1, 'days').toDate();
};

module.exports.findMaxSizeForAspectInSize = function(aspect, size) {
    this._validateSizeObject(aspect);
    this._validateSizeObject(size);

    const scale = Math.min(size.width / aspect.width, size.height / aspect.height);

    return {
        width: aspect.width * scale,
        height: aspect.height * scale
    };
};

module.exports._validateSizeObject = function(size) {
    if (arguments.length === 0) {
        throw new ReferenceError('argument "size" is missing');
    }

    if (!_.isPlainObject(size)) {
        throw new TypeError('argument "size" must be a plain object');
    }

    if (!_.isNumber(size['width']) || _.lt(size['width'], 1)) {
        throw new TypeError('argument "size" must have a numeric "width" property greater than 0');
    }

    if (!_.isNumber(size['height']) || _.lt(size['height'], 1)) {
        throw new TypeError('argument "size" must have a numeric "height" property greater than 0');
    }

    return true;
};

module.exports.getHashForId = function(id) {
    if (arguments.length === 0) {
        throw new ReferenceError('argument "id" is missing');
    }

    if (!_.isNumber(id)) {
        throw new TypeError('argument "id" must be a number');
    }

    return hashids.encode(id);
};

module.exports.getIdForHash = function(hash) {
    if (arguments.length === 0) {
        throw new ReferenceError('argument "hash" is missing');
    }

    if (!_.isString(hash)) {
        throw new TypeError('argument "hash" must be a number');
    }

    return hashids.decode(hash);
};

module.exports.pluckCurlyBraceEnclosedContent = function(text) {
    if (!text) {
        throw new ReferenceError('text argument is required');
    }

    if (!_.isString(text)) {
        throw new TypeError('text argument must be a string');
    }

    const trimmed = _.trim(text);
    const inline = trimmed.replace(/[\n\t]/g, '').replace(/\s+/g, ' ');
    const wrappedItems = inline.match(/{[^{}]+}/g);

    if (!wrappedItems) {
        return [];
    }

    return wrappedItems.map(i => i.replace('{', '').replace('}', ''));
};
