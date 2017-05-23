/**
 * custom
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const services = require('../../app/services');
const Auth = services['Auth'];
const Utility = services['Utility'];
const k = require('../../config/keys.json');
const User = require('../../app/models')[k.Model.User];
const Language = require('../../app/models')[k.Model.Language];

const Promise = require('bluebird');
const _ = require('lodash');

function CustomStrategy() {
    this.name = 'custom';
}

CustomStrategy.prototype.authenticate = function(req) {
    const self = this;

    let token = null;
    try {
        token = Utility.extractAuthTokenFromRequest(req);
    } catch (e) {
        self.error(e);
    }

    return Auth.verifyToken(token).then(decodedToken => {
        return Promise.join(User.findById(decodedToken.sub, {
            include: [
                {
                    model: Language,
                    as: k.Attr.DefaultStudyLanguage,
                    attributes: [k.Attr.Code, k.Attr.Name]
                }
            ]
        }), Auth.refreshToken(decodedToken));
    }).spread((user, refreshedToken) => {
        Auth.setAuthHeadersOnResponseWithToken(req.res, refreshedToken);

        if (user) {
            self.success(user);
        } else {
            self.fail();
        }
    }).catch(self.error);
};

const strategy = new CustomStrategy();

module.exports = strategy;
