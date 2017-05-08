/**
 * response-wrapper
 * get-native.com
 *
 * Created by henryehly on 2017/03/14.
 */

const _ = require('lodash');

module.exports.wrap = (list) => {
    if (!_.isArray(list)) {
        throw new TypeError(`Argument must be an array`);
    }

    let wrappedList = {records: [], count: 0};

    for (let item of list) {
        if (!_.isPlainObject(item)) {
            throw new TypeError(`Item must be an object`);
        }

        wrappedList.records.push(item);
        wrappedList.count += 1;
    }

    return wrappedList;
};

module.exports.deepWrap = (list, properties) => {
    if (arguments.length < 2) {
        throw new Error('No sub-property list provided. Please use \'wrap\' instead.');
    }

    if (!_.isArray(properties)) {
        throw new TypeError(`Sub-property list must be of type 'array'`);
    }

    let wrappedList = module.exports.wrap(list);

    for (let p of properties) {

        for (let i = 0; i < wrappedList.count; i++) {
            let record = wrappedList.records[i];

            if (!record.hasOwnProperty(p)) {
                throw new ReferenceError(`Record has no own property '${p}'`);
            }

            record[p] = module.exports.wrap(record[p]);
        }
    }

    return wrappedList;
};
