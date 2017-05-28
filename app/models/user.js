/**
 * user
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const Utility = require('../services')['Utility'];
const k       = require('../../config/keys.json');

const moment  = require('moment');
const _       = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define(k.Model.User, {
        browser_notifications_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
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
        tableName: 'users',
        underscored: true,
        associations: function(models) {
            models[k.Model.User].hasMany(models[k.Model.Follower], {as: 'followers'});
            models[k.Model.User].hasMany(models[k.Model.Notification], {as: 'notifications'});
            models[k.Model.User].hasMany(models[k.Model.CuedVideo], {as: 'cued_videos'});
            models[k.Model.User].hasMany(models[k.Model.Like], {as: 'likes'});
            models[k.Model.User].hasMany(models[k.Model.StudySession], {as: 'study_sessions'});
            models[k.Model.User].belongsTo(models[k.Model.Language], {as: k.Attr.DefaultStudyLanguage});
        },
        defaultScope: {
            include: [
                {
                    model: sequelize.models[k.Model.Language],
                    attributes: [k.Attr.Name, k.Attr.Code],
                    as: k.Attr.DefaultStudyLanguage
                }
            ]
        }
    });

    User.existsForEmail = function(email) {
        if (!_.isString(email)) {
            throw new TypeError(`Argument 'email' must be a string`);
        }

        return sequelize.query(`SELECT EXISTS(SELECT id FROM users WHERE email = ?) AS does_exist`, {
            replacements: [
                email
            ]
        }).spread(rows => {
            return _.first(rows).does_exist;
        });
    };

    User.findOrCreateFromPassportProfile = async function(profile) {
        if (!profile.id || !profile.provider || !profile.displayName || !profile.emails) {
            throw new ReferenceError('arguments id, provider, displayName and emails must be present');
        }

        const languageId = await sequelize.models[k.Model.Language].findIdForCode('en');

        let user = await User.find({
            where: {
                email: _.first(profile.emails).value
            }
        });

        if (!user) {
            user = await User.create({
                default_study_language_id: languageId,
                email: _.first(profile.emails).value,
                name: profile.displayName
            });

            user = await user.reload();
        }

        const authAdapterTypeId = await sequelize.models[k.Model.AuthAdapterType].findIdForProvider(profile.provider);

        await sequelize.models[k.Model.Identity].findOrCreate({
            where: {
                user_id: user.get(k.Attr.Id),
                auth_adapter_user_id: profile.id,
                auth_adapter_type_id: authAdapterTypeId
            }
        });

        return user;
    };

    User.prototype.calculateStudySessionStatsForLanguage = function(lang) {
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
            WHERE user_id = ? AND videos.language_id = (SELECT id FROM languages WHERE code = ? LIMIT 1) AND is_completed = true;
        `;

        return sequelize.query(query, {replacements: [this.id, lang]}).spread(rows => {
            const result = _.first(rows);
            result.total_time_studied = _.toNumber(result.total_time_studied);
            return result;
        });
    };

    User.prototype.calculateWritingStatsForLanguage = function(lang) {
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
                WHERE user_id = ? AND videos.language_id = (SELECT id FROM languages WHERE code = ? LIMIT 1) AND is_completed = true
            );
        `;

        return sequelize.query(query, {replacements: [this.id, lang]}).spread(_.first);
    };

    User.prototype.calculateStudyStreaksForLanguage = function(lang) {
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
                    WHERE user_id = ? AND videos.language_id = (SELECT id FROM languages WHERE code = ? LIMIT 1) AND is_completed = true
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

    User.prototype.isAdmin = async function() {
        const result = await sequelize.query(`
            SELECT (roles.name = 'admin') AS is_admin
            FROM users
            LEFT JOIN user_roles ON users.id = user_roles.user_id
            LEFT JOIN roles ON user_roles.role_id = roles.id
            WHERE users.id = ?;
        `, {replacements: [this.id]});

        return _.first(_.first(result))['is_admin'] === 1;
    };

    return User;
};
