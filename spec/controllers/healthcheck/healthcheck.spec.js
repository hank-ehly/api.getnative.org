/**
 * healthcheck.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/08/21.
 */

const SpecUtil = require('../../spec-util');

const request = require('supertest');
const assert = require('assert');
const mocha = require('mocha');
const [describe, it] = [mocha.describe, mocha.it];

describe('GET /healthcheck', function() {

    let server;

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.startServer();
        server = results.server;
    });

    afterEach(function(done) {
        server.close(done);
    });

    it('should return 200 OK in response to a valid request', function() {
        return request(server).get('/healthcheck').expect(200);
    });

    it('should return the package.json version in the response body', async function() {
        const response = await request(server).get('/healthcheck');
        assert.equal(response.text, require('../../../package.json').version);
    });

});
