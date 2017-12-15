/**
 * video
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');
const _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
    const Video = sequelize.define('Video', {
        youtube_video_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        is_public: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'videos',
        paranoid: true,
        underscored: true,
        associations: function(models) {
            models[k.Model.Video].belongsTo(models[k.Model.Speaker], {as: 'speaker'});
            models[k.Model.Video].belongsTo(models[k.Model.Subcategory], {as: 'subcategory'});
            models[k.Model.Video].belongsTo(models[k.Model.Language], {as: 'language'});
            models[k.Model.Video].hasMany(models[k.Model.CuedVideo], {as: 'cued_videos'});
            models[k.Model.Video].hasMany(models[k.Model.Like], {as: 'likes'});
            models[k.Model.Video].hasMany(models[k.Model.StudySession], {as: 'study_sessions'});
            models[k.Model.Video].hasMany(models[k.Model.Transcript], {as: 'transcripts'});
        },
        scopes: {
            count: function(count) {
                return {limit: count ? +count : 9};
            },
            cuedAndMaxId: function(cuedOnly, userId, maxId) {
                const conditions = {};

                if (cuedOnly && userId) {
                    conditions.where = {
                        id: {
                            $in: [sequelize.literal('SELECT `video_id` FROM `cued_videos` WHERE `user_id` = ' + userId)]
                        }
                    };
                }

                if (maxId) {
                    if (conditions.where && conditions.where.id) {
                        conditions.where.id.$lt = +maxId;
                    } else {
                        conditions.where = {id: {$lt: +maxId}}
                    }
                }

                return conditions;
            },
            newestFirst: {
                order: [[k.Attr.Id, 'DESC']]
            },
            orderMostViewed: { // todo
                order: [[k.Attr.LoopCount, 'DESC']]
            },
            relatedToVideo: function(videoId) {
                const queryString = ` 
                    SELECT id
                    FROM subcategories
                    WHERE category_id = (
                        SELECT category_id
                        FROM subcategories
                        WHERE id = (
                            SELECT subcategory_id
                            FROM videos
                            WHERE id = ${videoId}
                        )
                    )
                `;

                return {
                    where: {
                        subcategory_id: {$in: [sequelize.literal(queryString)]}
                    }
                };
            },
            orderByRandom: {
                order: [sequelize.fn('RAND')]
            }
        }
    });

    Video.getCuedAttributeForUserId = function(userId) {
        const query = 'EXISTS(SELECT `video_id` FROM `cued_videos` WHERE `video_id` = `Video`.`id` AND `user_id` = ' + userId + ')';
        return [sequelize.literal(query), 'cued'];
    };

    Video.isLikedByUser = function(db, videoId, userId) {
        const query = `SELECT EXISTS(SELECT id FROM likes WHERE video_id = ${videoId} AND user_id = ${userId}) AS isLiked`;
        return sequelize.query(query).then(r => _(r).flatten().first()['isLiked'] === 1);
    };

    Video.isCuedByUser = function(videoId, userId) {
        const query = `SELECT EXISTS(SELECT video_id, user_id FROM cued_videos WHERE video_id = ${videoId} AND user_id = ${userId}) AS isCued`;
        return sequelize.query(query).then(r => _(r).flatten().first()['isCued'] === 1);
    };

    Video.getLikeCount = function(db, videoId) {
        return db[k.Model.Like].count({where: {video_id: videoId}});
    };

    return Video;
};
