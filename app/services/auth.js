/**
 * auth
 * get-native.com
 *
 * Created by henryehly on 2017/03/20.
 */

const Utility = require('./utility');
const config  = require('../../config');
const k       = require('../../config/keys.json');

const Promise = require('bluebird');
const sodium  = require('sodium').api;
const crypto  = require('crypto');
const moment  = require('moment');
const jwt     = require('jsonwebtoken');
const url     = require('url');
const _       = require('lodash');

module.exports.validateRequest = function(req) {
    const args = {
        issuer: config.get(k.API.Hostname),
        audience: '', // todo
        algorithms: ['RS256']
    };

    const token = Utility.extractAuthTokenFromRequest(req);

    return Promise.promisify(jwt.verify)(token, config.get(k.PublicKey), args);
};

module.exports.refreshToken = token => {
    if (!token) {
        throw new ReferenceError(`Missing required 'token'`);
    }

    else if (!_.isPlainObject(token)) {
        throw new TypeError(`'token' must be a plain object`);
    }

    const cloneToken = Object.assign({}, token);

    delete cloneToken.exp;

    const args = {
        algorithm: 'RS256',
        expiresIn: '1h'
    };

    return Promise.promisify(jwt.sign)(cloneToken, config.get(k.PrivateKey), args);
};

module.exports.generateTokenForAccountId = accountId => {
    const token = {
        iss: config.get(k.API.Hostname),
        sub: accountId,
        aud: ''
    };

    const args = {
        algorithm: 'RS256',
        expiresIn: '1h'
    };

    return Promise.promisify(jwt.sign)(token, config.get(k.PrivateKey), args);
};

module.exports.setAuthHeadersOnResponseWithToken = (res, token) => {
    res.set('X-GN-Auth-Expire', moment().add(1, 'hours').valueOf().toString());
    res.set('X-GN-Auth-Token', token);
};

module.exports.extractAccountIdFromRequest = req => {
    return jwt.decode(Utility.extractAuthTokenFromRequest(req)).sub;
};

module.exports.hashPassword = password => {
    if (!password) {
        throw new ReferenceError('No password provided');
    }

    if (!_.isString(password)) {
        throw new TypeError('Password must be a string');
    }

    const passwordBuffer = new Buffer(password);
    const pwhash = sodium.crypto_pwhash_str(
        passwordBuffer,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
    );

    return pwhash.toString();
};

module.exports.verifyPassword = (pwhash, password) => {
    if (!pwhash || !password) {
        throw new ReferenceError('Hash and password are required');
    }

    if (!_.isString(pwhash) || !_.isString(password)) {
        throw new TypeError('Hash and password must both be strings');
    }

    const pwhashBuffer   = new Buffer(pwhash);
    const passwordBuffer = new Buffer(password);

    try {
        return sodium.crypto_pwhash_str_verify(pwhashBuffer, passwordBuffer);
    } catch (e) {
        return false;
    }
};

module.exports.generateVerificationToken = () => {
    return crypto.randomBytes(16).toString('hex');
};

module.exports.generateConfirmationURLForToken = token => {
    if (!token) {
        throw new ReferenceError(`Missing required token`);
    }

    if (!_.isString(token)) {
        throw new TypeError(`Invalid token`)
    }

    return url.format({
        protocol: config.get(k.Client.Protocol),
        host: config.get(k.Client.Host),
        pathname: 'confirm_email',
        query: {token: token}
    });
};
