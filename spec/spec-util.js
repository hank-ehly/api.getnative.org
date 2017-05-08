/**
 * spec-util
 * get-native.com
 *
 * Created by henryehly on 2017/03/03.
 */

const url     = require('url');
const request = require('supertest');
const Promise = require('bluebird');
const exec    = require('child_process').exec;
const MailDev = require('maildev');
const jwt     = require('jsonwebtoken');

let maildev = null;

module.exports.defaultTimeout = 30000;
module.exports.credentials    = {email: 'test@email.com', password: 'test_password'};

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
    return Promise.promisify(maildev.listen)();
};

module.exports.stopMailServer = function() {
    return Promise.promisify(maildev.end)();
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

module.exports.startServer = function() {
    return new Promise(function(resolve, reject) {
        const initPath = '../index';
        delete require.cache[require.resolve(initPath)];
        return require(initPath).then(resolve).catch(reject);
    });
};

module.exports.login = function() {
    return new Promise(function(resolve, reject) {
        return module.exports.startServer().then(function(initGroup) {
            return request(initGroup.server).post('/login').send(module.exports.credentials).then(function(response) {
                const retObj         = initGroup;
                retObj.authorization = 'Bearer: ' + response.headers['x-gn-auth-token'];
                retObj.response      = response;
                resolve(retObj);
            }).catch(reject);
        });
    });
};

module.exports.isParsableTimestamp = function(value) {
    return new Date(value).toDateString() !== 'Invalid Date';
};

module.exports.isValidURL = function(value) {
    let parsedURL = url.parse(value);
    return parsedURL.protocol && parsedURL.hostname;
};

module.exports.isValidEmail = function(value) {
    let regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*');
    return regex.test(value);
};

// Example: 'Thu Dec 14 04:35:55 +0000 2017'
module.exports.isClientFriendlyDateString = function(value) {
    let regex = /[A-Z][a-z][a-z]\s[A-Z][a-z][a-z]\s[0-3][0-9]\s[0-2][0-9]:[0-5][0-9]:[0-5][0-9]\s\+[0-9][0-9][0-9][0-9]\s[0-9][0-9][0-9][0-9]/g
    return regex.test(value);
};

module.exports.createJWTWithSubject = function(sub) {
    return Promise.promisify(jwt.sign)({
        iss: '_',
        sub: sub,
        aud: ''
    }, 'secret', {
        expiresIn: '1h'
    });
};
