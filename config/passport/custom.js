/**
 * custom
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/05/12.
 */

const Auth = require('../../app/services/auth');
const Utility = require('../../app/services/utility');
const k = require('../../config/keys.json');
const db = require('../../app/models');

const _ = require('lodash');

function CustomStrategy() {
    this.name = 'custom';
}

CustomStrategy.prototype.authenticate = async function(req) {
    let user, token;

    try {
        token = Utility.extractAuthTokenFromRequest(req);
        const decodedToken = await Auth.verifyToken(token);
        user = await db[k.Model.User].findByPrimary(decodedToken.sub, {rejectOnEmpty: true});
        const refreshedToken = await Auth.refreshDecodedToken(decodedToken);
        Auth.setAuthHeadersOnResponseWithToken(req.res, refreshedToken);
    } catch (e) {
        return this.pass();
    }

    if (user) {
        this.success(user);
    } else {
        this.pass();
    }
};

const strategy = new CustomStrategy();

module.exports = strategy;
