/**
 * speakers
 * get-native.com
 *
 * Created by henryehly on 2017/03/16.
 */

const k = require('../../config/keys.json');
const Speaker = require('../models')[k.Model.Speaker];

module.exports.show = async (req, res, next) => {
    let speaker;

    try {
        speaker = await Speaker.findById(req.params[k.Attr.Id], {
            attributes: {
                exclude: [
                    k.Attr.CreatedAt, k.Attr.UpdatedAt
                ]
            }
        });
    } catch (e) {
        next(e);
    }

    if (!speaker) {
        throw new Error('variable speaker is undefined');
    }

    res.send(speaker.get({
        plain: true
    }));
};
