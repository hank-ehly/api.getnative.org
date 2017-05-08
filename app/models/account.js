/**
 * account
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const Utility = require('../services').Utility;
const moment  = require('moment');
const _       = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const Account = sequelize.define('Account', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        browser_notifications_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email_notifications_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        default_study_language_code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'en'
        },
        picture_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        is_silhouette_picture: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'accounts',
        underscored: true,
        associations: function(models) {
            models.Account.hasMany(models.Follower, {as: 'followers'});
            models.Account.hasMany(models.Notification, {as: 'notifications'});
            models.Account.hasMany(models.CuedVideo, {as: 'cued_videos'});
            models.Account.hasMany(models.Like, {as: 'likes'});
            models.Account.hasMany(models.StudySession, {as: 'study_sessions'});
        }
    });

    Account.existsForEmail = function(email) {
        if (!_.isString(email)) {
            throw new TypeError(`Argument 'email' must be a string`);
        }

        const query = `
            SELECT EXISTS(
                SELECT id
                FROM accounts 
                WHERE email = ?
            ) AS does_exist
        `;

        return sequelize.query(query, {replacements: [email]}).spread(rows => _.first(rows).does_exist);
    };

    Account.prototype.calculateStudySessionStatsForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        // todo: make globally available list of valid lang codes
        if (!_.includes(['en', 'ja'], lang)) {
            throw new TypeError(`Invalid lang '${lang}'`);
        }

        const query = `
            SELECT
                COALESCE(SUM(study_time), 0) AS total_time_studied,
                COUNT(study_sessions.id)     AS total_study_sessions
            FROM study_sessions
                LEFT JOIN videos ON study_sessions.video_id = videos.id
            WHERE account_id = ? AND videos.language_code = ? AND is_completed = true;
        `;

        return sequelize.query(query, {replacements: [this.id, lang]}).spread(rows => {
            const result = _.first(rows);
            result.total_time_studied = _.toNumber(result.total_time_studied);
            return result;
        });
    };

    Account.prototype.calculateWritingStatsForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        // todo: make globally available list of valid lang codes
        if (!_.includes(['en', 'ja'], lang)) {
            throw new TypeError(`Invalid lang '${lang}'`);
        }

        const query = `
            SELECT
                COALESCE(MAX(word_count), 0)       AS maximum_words,
                COALESCE(MAX(words_per_minute), 0) AS maximum_wpm
            FROM writing_answers
            WHERE study_session_id IN (
                SELECT study_sessions.id
                FROM study_sessions
                    LEFT JOIN videos ON study_sessions.video_id = videos.id
                WHERE account_id = ? AND videos.language_code = ? AND is_completed = true
            );
        `;

        return sequelize.query(query, {replacements: [this.id, lang]}).spread(_.first);
    };

    Account.prototype.calculateStudyStreaksForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        // todo: make globally available list of valid lang codes
        if (!_.includes(['en', 'ja'], lang)) {
            throw new TypeError(`Invalid lang '${lang}'`);
        }

        const query = `
            SELECT
                MAX(DateCol) AS StreakEndDate,
                COUNT(*)     AS Streak
            FROM (
                SELECT
                    DateCol,
                    (@rn := @rn + 1) RowNumber
                FROM (
                    SELECT DISTINCT DATE(study_sessions.created_at) AS DateCol
                    FROM study_sessions
                        LEFT JOIN videos ON study_sessions.video_id = videos.id
                    WHERE account_id = ? AND videos.language_code = ? AND is_completed = true
                    ORDER BY DateCol DESC
                ) t, (
                    SELECT @rn := 0
                ) var
            ) t
            GROUP BY DATE_ADD(DateCol, INTERVAL RowNumber DAY)
            ORDER BY StreakEndDate DESC;
        `;

        return sequelize.query(query, {replacements: [this.id, lang]}).spread(rows => {
            const result = {
                consecutive_days: 0,
                longest_consecutive_days: 0
            };

            if (!rows.length) {
                return result;
            }

            result.longest_consecutive_days = _.maxBy(rows, 'Streak').Streak;

            const rowOfLastStreakEndDate = _.maxBy(rows, 'StreakEndDate');
            const lastStreakEndMoment = moment(rowOfLastStreakEndDate.StreakEndDate);

            if (!lastStreakEndMoment) {
                throw new Error('Invalid date format');
            }

            const timeSinceLastSession = moment.duration({
                from: lastStreakEndMoment,
                to: moment().utc()
            });

            if (timeSinceLastSession.hours() < 24) {
                result.consecutive_days = rowOfLastStreakEndDate.Streak;
            }

            return result;
        });
    };

    return Account;
};
