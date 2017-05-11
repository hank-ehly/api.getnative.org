/**
 * oauth
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/12.
 */

const logger = require('../../config/logger');

module.exports.facebookCallback = (req, res) => {
    logger.info(req.user);
    res.redirect('http://localhost:5555');
};
