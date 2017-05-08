/**
 * like
 * get-native.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    const Like = sequelize.define('Like', {}, {
        tableName: 'likes',
        underscored: true,
        updatedAt: false,
        associations: function(models) {
            models.Like.belongsTo(models.Account);
            models.Like.belongsTo(models.Video);
        }
    });

    Like.removeAttribute('id');

    return Like;
};