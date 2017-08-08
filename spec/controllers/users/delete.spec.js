/**
 * delete.spec
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/07/23.
 */

const SpecUtil = require('../../spec-util');
const k = require('../../../config/keys.json');
const Auth = require('../../../app/services/auth');
const Utility = require('../../../app/services/utility');
const config = require('../../../config/application').config;

const m = require('mocha');
const [describe, it, before, beforeEach, after, afterEach] = [m.describe, m.it, m.before, m.beforeEach, m.after, m.afterEach];
const request = require('supertest');
const assert = require('assert');
const chance = require('chance').Chance();
const _ = require('lodash');

describe('DELETE /users', function() {
    let authorization, server, user, db, users;

    before(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    beforeEach(async function() {
        this.timeout(SpecUtil.defaultTimeout);
        const retObj = await SpecUtil.startServer();

        const credentials = SpecUtil.credentials;
        if (users) {
            credentials.email = _.sample(users).get(k.Attr.Email);
            credentials.password = 'password';
        }

        const response = await request(retObj.server).post('/sessions').send(credentials);

        authorization = ['Bearer:', response.headers[k.Header.AuthToken]].join(' ');
        server = retObj.server;
        user = response.body;
        db = retObj.db;

        if (!users) {
            users = await db[k.Model.User].findAll({
                attributes: [k.Attr.Email]
            });
        }
    });

    afterEach(function(done) {
        server.close(done);
    });

    describe('failure', function() {
        it('should respond with 400 Bad Request if "reason" is not a string', function() {
            return request(server).delete('/users').set(k.Header.Authorization, authorization).send({reason: _.stubObject()}).expect(400);
        });
    });

    describe('success', function() {
        it('should delete the User record', async function() {
            // create dependent EmailChangeRequest record not created in seed
            const token = await db[k.Model.VerificationToken].create({
                user_id: user.id,
                token: Auth.generateRandomHash(),
                expiration_date: Utility.tomorrow()
            });

            await db[k.Model.EmailChangeRequest].create({
                email: 'test-' + chance.email(),
                verification_token_id: token.get(k.Attr.Id)
            });

            await request(server).delete('/users').set(k.Header.Authorization, authorization);
            assert(!await db[k.Model.User].findByPrimary(user[k.Attr.Id]));
        });

        it('should send an email to the getnative owner', async function() {
            const testReason = 'this is the test reason';
            await request(server).delete('/users').set(k.Header.Authorization, authorization).send({reason: testReason});
            const emails = await SpecUtil.getAllEmail();
            const recipientEmailAddress = _.first(_.last(emails).envelope.to).address;
            assert.equal(recipientEmailAddress, config.get(k.EmailAddress.Contact));
        });

        it('should send an email containing the confirmation URL (with the correct VerificationToken token)', async function() {
            const testReason = 'this is the test reason';
            await request(server).delete('/users').set(k.Header.Authorization, authorization).send({reason: testReason});
            const emails = await SpecUtil.getAllEmail();
            assert(_.includes(_.last(emails).html, testReason));
        });
    });
});
