/**
 * clean.spec
 * get-native.com
 *
 * Created by henryehly on 2017/05/06.
 */

const SpecUtil = require('../../spec-util');
const db = require('../../../app/models');
const k = require('../../../config/keys.json');
const VerificationToken = db[k.Model.VerificationToken];
const Account = db[k.Model.Account];
const Auth = require('../../../app/services')['Auth'];

const assert = require('assert');
const moment = require('moment');
const execFileSync = require('child_process').execFileSync;
const path = require('path');
const _ = require('lodash');

const taskPath = path.resolve(__dirname, '..', '..', '..', 'app', 'tasks', 'verification-tokens', 'clean.js');
const nowFmt = moment().format("YYYY-MM-DD HH:mm:ss");

describe('clean (VerificationToken)', function() {
    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    afterEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAllUndo();
    });

    it(`should delete all VerificationToken records whose expiration date is equal to or before the current time`, function(done) {
        this.timeout(SpecUtil.defaultTimeout);

        const query = `
            SELECT COUNT(*) AS count
            FROM verification_tokens
            WHERE expiration_date <= ?;
        `;

        execFileSync(taskPath);

        db.sequelize.query(query, {replacements: [nowFmt]}).then(function(results) {
            const count = _.first(_.flatten(results))['count'];
            assert.equal(count, 0);
            done();
        });
    });

    it(`should not delete VerificationToken records whose expiration date is in the future`, function(done) {
        this.timeout(SpecUtil.defaultTimeout);

        Account.findOne().then(function(account) {
            let accountId = account.get(k.Attr.Id);

            return VerificationToken.create({
                account_id: accountId,
                token: Auth.generateVerificationToken(),
                expiration_date: moment().add(1, 'days').toDate()
            });
        }).then(function() {
            const query = `
                SELECT COUNT(*) AS count
                FROM verification_tokens
                WHERE expiration_date > ?;
            `;

            execFileSync(taskPath);

            db.sequelize.query(query, {replacements: [nowFmt]}).then(function(results) {
                const count = _.first(_.flatten(results))['count'];
                assert.notEqual(count, 0);
                done();
            });
        });
    });
});
