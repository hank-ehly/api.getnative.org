/**
 * video
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

const k = require('../../config/keys.json');

module.exports = function(sequelize, DataTypes) {
    const Video = sequelize.define('Video', {
        length: DataTypes.INTEGER,
        picture_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        loop_count: DataTypes.INTEGER,
        video_url: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'videos',
        underscored: true,
        associations: function(models) {
            models[k.Model.Video].belongsTo(models[k.Model.Speaker]);
            models[k.Model.Video].belongsTo(models[k.Model.Subcategory]);
            models[k.Model.Video].belongsTo(models[k.Model.Language]);
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
                        conditions.where = {
                            id: {
                                $lt: +maxId
                            }
                        }
                    }
                }

                return conditions;
            },
            newestFirst: {
                order: [['created_at', 'DESC']]
            },
            includeSpeakerName: function(Speaker) {
                return {include: [{model: Speaker, attributes: ['name'], as: 'speaker'}]}
            },
            includeSubcategoryNameAndId: function(Subcategory) {
                return {include: [{model: Subcategory, attributes: ['id', 'name'], as: 'subcategory'}]}
            },
            orderMostViewed: {
                order: [['loop_count', 'DESC']]
            },
            includeTranscripts: function() {
                return {
                    include: [
                        {
                            model: sequelize.model(k.Model.Transcript),
                            attributes: ['id', 'text', 'language_code'],
                            as: 'transcripts',
                            include: {
                                model: sequelize.model(k.Model.Collocation),
                                attributes: ['text', 'description', 'ipa_spelling'],
                                as: 'collocations',
                                include: {
                                    model: sequelize.model(k.Model.UsageExample),
                                    attributes: ['text'],
                                    as: 'usage_examples'
                                }
                            }
                        }
                    ]
                }
            },
            relatedToVideo: function(videoId) {
                // todo: could this be more clean and/or efficient?
                return {
                    where: {
                        subcategory_id: {
                            $in: [sequelize.literal(`
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
                            `)]
                        }
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
        // todo: use EXISTS
        return db.Like.count({where: ['video_id = ? AND user_id = ?', videoId, userId]}).then(c => c === 1);
    };

    Video.isCuedByUser = function(db, videoId, userId) {
        // todo: use EXISTS
        return db.CuedVideo.count({where: ['video_id = ? AND user_id = ?', videoId, userId]}).then(c => c === 1);
    };

    Video.getLikeCount = function(db, videoId) {
        return db.Like.count({where: ['video_id = ?', videoId]});
    };

    return Video;
};
