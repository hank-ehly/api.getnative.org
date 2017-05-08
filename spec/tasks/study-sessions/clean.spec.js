/**
 * clean-study-sessions.spec
 * get-native.com
 *
 * Created by henryehly on 2017/05/06.
 */

const SpecUtil     = require('../../spec-util');
const db           = require('../../../app/models');

const execFileSync = require('child_process').execFileSync;
const assert       = require('assert');
const moment       = require('moment');
const path         = require('path');
const _            = require('lodash');

const yesterday    = moment().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
const taskPath     = path.resolve(__dirname, '..', '..', '..', 'app', 'tasks', 'study-sessions', 'clean.js');

describe('clean (StudySession)', function() {
    beforeEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAll();
    });

    afterEach(function() {
        this.timeout(SpecUtil.defaultTimeout);
        return SpecUtil.seedAllUndo();
    });

    it(`should remove all StudySession records where 'is_completed' is false and more than 24 has passed since 'created_at'`, function(done) {
        this.timeout(SpecUtil.defaultTimeout);

        const q = `
            SELECT COUNT(*) AS count
            FROM study_sessions 
            WHERE is_completed = false AND created_at < ?;
        `;

        execFileSync(taskPath);

        db.sequelize.query(q, {replacements: [yesterday]}).then(function(result) {
            const count = _.first(_.flatten(result))['count'];
            assert.equal(count, 0);
            done();
        });
    });

    it(`should not remove a StudySession record whose 'is_completed' is false if 'created_at' is less than 24 ago`, function(done) {
        this.timeout(SpecUtil.defaultTimeout);

        const q = `
            SELECT COUNT(*) AS count
            FROM study_sessions
            WHERE is_completed = false AND created_at > ?;
        `;

        db.sequelize.query(q, {replacements: [yesterday]}).then(function(r1) {
            let c1 = _.first(_.flatten(r1)).count;
            execFileSync(taskPath);

            db.sequelize.query(q, {replacements: [yesterday]}).then(function(r2) {
                let c2 = _.first(_.flatten(r2))['count'];
                assert.equal(c1, c2);
                done();
            });
        });
    });
});
