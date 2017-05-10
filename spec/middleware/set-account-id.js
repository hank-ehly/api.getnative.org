/**
 * set-user-id
 * get-native.com
 *
 * Created by henryehly on 2017/04/21.
 */

const SetUserId = require('../../app/middleware').SetUserId;
const SpecUtil     = require('../spec-util');

const request      = require('supertest');
const Promise      = require('bluebird');
const assert       = require('assert');
const jwt          = require('jsonwebtoken');
const app          = require('express')();

describe('SetUserId', function() {
    before(function() {
        app.get('/', SetUserId, function(req, res) {
            //noinspection JSUnresolvedVariable
            res.send({userId: req.userId});
        });
    });

    it(`should set the userId on the request object`, function() {
        let expectedId = 212578;
        return SpecUtil.createJWTWithSubject(expectedId).then(function(token) {
            return request(app).get('/').set('authorization', `Bearer ${token}`);
        }).then(function(response) {
            //noinspection JSUnresolvedVariable
            assert(response.body.userId, expectedId);
        });
    });

    it(`should not set req.userId if not authorization header is present`, function() {
        return request(app).get('/').then(function(response) {
            assert(!response.body.userId);
        });
    });
});
