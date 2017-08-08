/**
 * follower
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/02/24.
 */

module.exports = function(sequelize, DataTypes) {
    const Follower = sequelize.define('Follower', {}, {
        tableName: 'followers',
        underscored: true,
        associations: function(models) {
            models.Follower.belongsTo(models.Speaker);
            models.Follower.belongsTo(models.User);
        }
    });

    Follower.removeAttribute('id');

    return Follower;
};
