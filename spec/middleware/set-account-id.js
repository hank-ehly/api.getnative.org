/**
 * set-account-id
 * get-native.com
 *
 * Created by henryehly on 2017/04/21.
 */

const SetAccountId = require('../../app/middleware').SetAccountId;
const SpecUtil     = require('../spec-util');

const request      = require('supertest');
const Promise      = require('bluebird');
const assert       = require('assert');
const jwt          = require('jsonwebtoken');
const app          = require('express')();

describe('SetAccountId', function() {
    before(function() {
        app.get('/', SetAccountId, function(req, res) {
            //noinspection JSUnresolvedVariable
            res.send({accountId: req.accountId});
        });
    });

    it(`should set the accountId on the request object`, function() {
        let expectedId = 212578;
        return SpecUtil.createJWTWithSubject(expectedId).then(function(token) {
            return request(app).get('/').set('authorization', `Bearer ${token}`);
        }).then(function(response) {
            //noinspection JSUnresolvedVariable
            assert(response.body.accountId, expectedId);
        });
    });

    it(`should not set req.accountId if not authorization header is present`, function() {
        return request(app).get('/').then(function(response) {
            assert(!response.body.accountId);
        });
    });
});
