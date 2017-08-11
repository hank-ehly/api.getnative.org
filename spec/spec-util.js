/**
 * spec-util
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/03/03.
 */

const k       = require('../config/keys.json');

const url     = require('url');
const request = require('supertest');
const exec    = require('child_process').exec;
const MailDev = require('maildev');
const jwt     = require('jsonwebtoken');

let maildev;

module.exports.defaultTimeout   = 30000;
module.exports.credentials      = {email: 'test@email.com', password: 'password'};
module.exports.adminCredentials = {email: 'admin@email.com', password: 'password'};

module.exports.seedAll = function() {
    return new Promise(function(resolve, reject) {
        module.exports.seedAllUndo().then(function() {
            exec('npm run sequelize db:seed:all', function(e) {
                return e ? reject(e) : resolve();
            });
        });
    });
};

module.exports.seedAllUndo = function() {
    return new Promise(function(resolve, reject) {
        exec('npm run sequelize db:seed:undo:all', function(e) {
            return e ? reject(e) : resolve();
        });
    });
};

module.exports.startMailServer = function() {
    maildev = new MailDev({silent: true});
    return new Promise(function(resolve) {
        maildev.listen(function() {
            resolve();
        });
    });
};

module.exports.stopMailServer = function() {
    return new Promise(function(resolve) {
        maildev.close(function() {
            resolve();
        });
    });
};

module.exports.getAllEmail = function() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            maildev.getAllEmail(function(errors, store) {
                return errors ? reject(errors) : resolve(store);
            });
        }, 1);
    });
};

module.exports.deleteAllEmail = function() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            maildev.deleteAllEmail(function(error, success) {
                return error ? reject(error) : resolve(success);
            });
        }, 1);
    });
};

module.exports.startServer = function() {
    delete require.cache[require.resolve('../index')];
    return require('../index');
};

module.exports.login = async function(admin = false) {
    const retObj   = await module.exports.startServer();
    const response = await request(retObj.server).post('/sessions').send(admin ? module.exports.adminCredentials : module.exports.credentials);
    if (!response.headers[k.Header.AuthToken]) {
        throw new Error(response);
    }
    retObj.authorization = ['Bearer:', response.headers[k.Header.AuthToken]].join(' ');
    retObj.response = response;
    return retObj;
};

module.exports.isParsableTimestamp = function(value) {
    return new Date(value).toDateString() !== 'Invalid Date';
};

module.exports.isValidURL = function(value) {
    const parsedURL = url.parse(value);
    return parsedURL.protocol && parsedURL.hostname;
};

module.exports.isValidEmail = function(value) {
    const regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*');
    return regex.test(value);
};

// Example: 'Thu Dec 14 04:35:55 +0000 2017'
module.exports.isClientFriendlyDateString = function(value) {
    let regex = /[A-Z][a-z][a-z]\s[A-Z][a-z][a-z]\s[0-3][0-9]\s[0-2][0-9]:[0-5][0-9]:[0-5][0-9]\s\+[0-9][0-9][0-9][0-9]\s[0-9][0-9][0-9][0-9]/g
    return regex.test(value);
};

module.exports.throwsAsync = async function doesThrow(asyncTest, error) {
    try {
        await asyncTest();
    } catch (e) {
        return e && e instanceof error;
    }

    return false;
};
