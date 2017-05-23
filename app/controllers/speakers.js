/**
 * speakers
 * get-native.com
 *
 * Created by henryehly on 2017/03/16.
 */

const Speaker = require('../models').Speaker;
const k       = require('../../config/keys.json');

module.exports.show = (req, res, next) => {
    Speaker.findById(req.params.id, {
        attributes: {
            exclude: [
                k.Attr.CreatedAt, k.Attr.UpdatedAt
            ]
        }
    }).then(speaker => {
        res.send(speaker.get({plain: true}));
    }).catch(() => {
        next({
            message: 'Error',
            errors: [{message: 'Unable to fetch speaker'}]
        })
    });
};
