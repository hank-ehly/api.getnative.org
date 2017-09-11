/**
 * delete-profile-image
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/09/11.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');

const m = require('mocha');
const [describe, it, before, beforeEach, afterEach] = [m.describe, m.it, m.before, m.beforeEach,  m.afterEach];
const request = require('supertest');
const assert = require('assert');
const _ = require('lodash');

describe('DELETE /users/profile_image', function() {
    let user, server, authorization;

    before(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        await SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const results = await SpecUtil.login();
        authorization = results.authorization;
        server = results.server;
        user = await results.db[k.Model.User].findByPrimary(results.response.body[k.Attr.Id]);
        await user.update({profile_url: 'https://foo.com/test.jpg', is_silhouette_picture: false});
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('success', function() {
        it('should respond with an X-GN-Auth-Token header', async function() {
            const response = await request(server).delete('/users/profile_image').set(k.Header.Authorization, authorization);
            assert(_.gt(response.header[k.Header.AuthToken].length, 0));
        });

        it('should respond with an X-GN-Auth-Expire header containing a valid timestamp value', async function() {
            const response = await request(server).delete('/users/profile_image').set(k.Header.Authorization, authorization);
            assert(SpecUtil.isParsableTimestamp(+response.header[k.Header.AuthExpire]));
        });

        it('should return 204 No Content for a successful request', function() {
            return request(server).delete('/users/profile_image').set(k.Header.Authorization, authorization).expect(204);
        });

        it('should set user.is_silhouette_image to true', async function() {
            await request(server).delete('/users/profile_image').set(k.Header.Authorization, authorization);
            await user.reload();
            assert.equal(user.get(k.Attr.IsSilhouettePicture), true);
        });
    });
});
