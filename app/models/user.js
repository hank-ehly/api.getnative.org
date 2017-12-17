/**
 * user
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const Utility = require('../services/utility');
const Auth = require('../services/auth');
const k = require('../../config/keys.json');
const config = require('../../config/application').config;

const moment = require('moment');
const i18n = require('i18n');
const mailer = require('../../config/initializers/mailer');
const _ = require('lodash');
const path = require('path');

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
            models[k.Model.User].hasMany(models[k.Model.Identity], {as: 'identities'});
            models[k.Model.User].belongsTo(models[k.Model.Language], {as: k.Attr.DefaultStudyLanguage});
            models[k.Model.User].belongsTo(models[k.Model.Language], {as: k.Attr.InterfaceLanguage});
        },
        defaultScope: {
            include: [
                {
                    model: sequelize.models[k.Model.Language],
                    attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code],
                    as: k.Attr.DefaultStudyLanguage
                },
                {
                    model: sequelize.models[k.Model.Language],
                    attributes: [k.Attr.Id, k.Attr.Name, k.Attr.Code],
                    as: k.Attr.InterfaceLanguage
                }
            ]
        }
    });

    User.hook('afterCreate', async (user, options) => {
        const findRoleQueryOptions = {
            where: {
                name: k.UserRole.User
            }
        };

        if (options.transaction) {
            findRoleQueryOptions['transaction'] = options.transaction;
        }

        const role = await sequelize.models[k.Model.Role].find(findRoleQueryOptions);

        let createQueryOptions = {};
        if (options.transaction) {
            createQueryOptions['transaction'] = options.transaction;
        }

        const userRole = await sequelize.models[k.Model.UserRole].create({
            user_id: user.get(k.Attr.Id),
            role_id: role.get(k.Attr.Id)
        }, createQueryOptions);

        const vt = await sequelize.models[k.Model.VerificationToken].create({
            user_id: user.get(k.Attr.Id),
            token: Auth.generateRandomHash(),
            expiration_date: Utility.tomorrow()
        }, createQueryOptions);

        if (!options.req || !options.req.app || !options.req.__) {
            return;
        }

        const html = await new Promise((resolve, reject) => {
            let pathname = 'confirm_email';
            if (!config.isDev()) {
                pathname = [options.req.getLocale(), 'confirm_email'].join('/');
            }
            const confirmationURL = Auth.generateConfirmationURLForTokenWithPath(vt.get(k.Attr.Token), pathname);
            const locals = {
                __: options.req.__,
                __mf: options.req.__mf,
                confirmationURL: confirmationURL,
                contact: config.get(k.EmailAddress.Contact),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            };

            options.req.app.render(k.Templates.Welcome, locals, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        try {
            await mailer.sendMail({
                subject: options.req.__('welcome.subject'),
                from: config.get(k.EmailAddress.NoReply),
                to: user.get(k.Attr.Email),
                html: html
            }, null);
        } catch (e) {
            // Request can succeed, but mail is not sent
            console.log(e);
        }
    });

    User.hook('afterDestroy', async (user, options) => {
        if (!options.req || !options.req.body || !options.req.body.reason || !options.req.app || !options.req.__) {
            return;
        }

        const html = await new Promise((resolve, reject) => {
            const variables = {
                __: options.req.__,
                __mf: options.req.__mf,
                contact: config.get(k.EmailAddress.Contact),
                reason: options.req.body.reason,
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            };

            options.req.app.render(k.Templates.DeleteAccountReason, variables, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        try {
            await mailer.sendMail({
                subject: options.req.__('deleteAccountReason.subject'),
                from: config.get(k.EmailAddress.NoReply),
                to: config.get(k.EmailAddress.Contact),
                html: html
            }, null);
        } catch (e) {
            // Account deletion succeeded, but failed to send email
            console.log(e);
        }
    });

    User.existsForEmail = function(email) {
        if (!_.isString(email)) {
            throw new TypeError(`Argument 'email' must be a string`);
        }

        return sequelize.query('SELECT EXISTS(SELECT id FROM users WHERE email = ?) AS does_exist', {
            replacements: [
                email
            ]
        }).then(values => {
            const [rows] = values;
            return _.first(rows).does_exist;
        });
    };

    User.findOrCreateFromPassportProfile = async function(profile, req) {
        if (!profile.id || !profile.provider || !profile.displayName || !profile.emails) {
            throw new ReferenceError('arguments id, provider, displayName and emails must be present');
        }

        const localeId = await sequelize.models[k.Model.Language].findIdForCode(req.locale);
        const englishId = await sequelize.models[k.Model.Language].findIdForCode('en');

        const [user] = await this.findOrCreate({
            where: {email: _.first(profile.emails).value},
            defaults: {default_study_language_id: englishId, interface_language_id: localeId, name: profile.displayName},
            req: req
        });

        await user.reload();

        const authAdapterTypeId = await sequelize.models[k.Model.AuthAdapterType].findIdForProvider(profile.provider);

        await sequelize.models[k.Model.Identity].findOrCreate({
            where: {user_id: user.get(k.Attr.Id), auth_adapter_user_id: profile.id, auth_adapter_type_id: authAdapterTypeId}
        });

        return user;
    };

    User.prototype.calculateStudySessionStatsForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        if (!i18n.getLocales().includes(lang)) {
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

        return sequelize.query(query, {replacements: [this.id, lang]}).then(values => {
            const [rows] = values;
            const result = _.first(rows);
            result.total_time_studied = _.toNumber(result.total_time_studied);
            return result;
        });
    };

    User.prototype.calculateWritingStatsForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        if (!i18n.getLocales().includes(lang)) {
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

        return sequelize.query(query, {replacements: [this.id, lang]}).then(result => {
            return _.first(_.first(result));
        });
    };

    User.prototype.calculateStudyStreaksForLanguage = function(lang) {
        if (!lang) {
            throw new ReferenceError(`Required 'lang' argument is missing`);
        }

        if (!i18n.getLocales().includes(lang)) {
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

        return sequelize.query(query, {replacements: [this.id, lang]}).then(values => {
            const [rows] = values;

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
