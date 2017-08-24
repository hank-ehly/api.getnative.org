/**
 * credential
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/14.
 */

const k = require('../../config/keys.json');
const mailer = require('../../config/initializers/mailer');
const config = require('../../config/application').config;

module.exports = function(sequelize, DataTypes) {
    const Credential = sequelize.define(k.Model.Credential, {
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        }
    }, {
        tableName: 'credentials',
        underscored: true,
        associations: function(models) {
            models[k.Model.Credential].belongsTo(models[k.Model.User]);
        }
    });

    Credential.afterUpdate(async (credential, options) => {
        const html = await new Promise((resolve, reject) => {
            options.req.app.render(k.Templates.PasswordUpdated, {
                __: options.req.__,
                __mf: options.req.__mf,
                contact: config.get(k.EmailAddress.Contact),
                facebookPageURL: config.get(k.SNS.FacebookPageURL),
                twitterPageURL: config.get(k.SNS.TwitterPageURL),
                youtubeChannelURL: config.get(k.SNS.YouTubeChannelURL),
                websiteURL: config.get(k.Client.BaseURI)
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        await mailer.sendMail({
            subject: options.req.__('passwordUpdated.subject'),
            from: config.get(k.EmailAddress.NoReply),
            to: options.req.user.get(k.Attr.Email),
            html: html
        }, null);
    });

    return Credential;
};
