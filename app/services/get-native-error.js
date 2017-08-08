/**
 * get-native-error
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/04/02.
 */

const i18n    = require('i18n');
const _       = require('lodash');

function GetNativeError(code, overrideMessage) {
    Error.captureStackTrace(this, GetNativeError);

    if (!code) {
        throw new ReferenceError('No code provided');
    }

    if (!_.isString(code)) {
        throw new TypeError('Code must be a string');
    }

    if (overrideMessage && !_.isString(overrideMessage)) {
        throw new TypeError('Message must be a string');
    }

    this.message = _.defaultTo(overrideMessage, i18n.__(`errors.${code}`));
    this.code    = code;
}

GetNativeError.prototype = Object.create(Error.prototype);

module.exports = GetNativeError;
