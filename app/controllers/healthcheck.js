/**
 * healthcheck
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/08/21.
 */

module.exports.healthcheck = (req, res, next) => {
    res.set('Content-Type', 'text/plain');
    res.send(require('../../package.json').version);
};
