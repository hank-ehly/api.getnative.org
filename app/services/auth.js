/**
 * auth
 * api.getnative.org
 *
 * Created by henryehly on 2017/03/20.
 */

const Utility = require('./utility');
const config  = require('../../config/application').config;
const k       = require('../../config/keys.json');

const sodium  = require('sodium').api;
const crypto  = require('crypto');
const moment  = require('moment');
const jwt     = require('jsonwebtoken');
const url     = require('url');
const _       = require('lodash');

const _tokenSignOptions = {
    algorithm: 'RS256',
    expiresIn: '1h'
};

module.exports.verifyToken = function(token) {
    const args = {
        issuer: config.get(k.API.Hostname),
        audience: '', // todo
        algorithms: ['RS256']
    };

    return new Promise((resolve, reject) => {
        jwt.verify(token, config.get(k.PublicKey), args, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports.refreshDecodedToken = token => {
    if (!token) {
        throw new ReferenceError(`Missing required 'token'`);
    } else if (!_.isPlainObject(token)) {
        throw new TypeError(`'token' must be a plain object`);
    }

    delete token.exp;
    delete token.iat;
    delete token.exp;
    delete token.nbf;

    return new Promise((resolve, reject) => {
        jwt.sign(token, config.get(k.PrivateKey), _tokenSignOptions, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports.generateTokenForUserId = userId => {
    const token = {
        iss: config.get(k.API.Hostname),
        sub: userId,
        aud: ''
    };

    return new Promise((resolve, reject) => {
        jwt.sign(token, config.get(k.PrivateKey), _tokenSignOptions, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports.setAuthHeadersOnResponseWithToken = (res, token) => {
    res.set(k.Header.AuthExpire, moment().add(1, 'hours').valueOf().toString());
    res.set(k.Header.AuthToken, token);
};

module.exports.extractUserIdFromRequest = req => {
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

module.exports.generateRandomHash = () => {
    return crypto.randomBytes(16).toString('hex');
};

module.exports.generateConfirmationURLForTokenWithPath = (token, pathname) => {
    if (!token || !pathname) {
        throw new ReferenceError('Missing required token and/or pathname');
    }

    if (!_.isString(token) || !_.isString(pathname)) {
        throw new TypeError('Invalid token and/or pathname');
    }

    return url.format({
        protocol: config.get(k.Client.Protocol),
        host: config.get(k.Client.Host),
        pathname: pathname,
        query: {token: token}
    });
};
