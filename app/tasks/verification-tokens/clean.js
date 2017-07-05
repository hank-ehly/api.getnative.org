const db = require('../../models');
const k = require('../../../config/keys.json');

const moment = require('moment');
const _ = require('lodash');

async function clean() {
    try {
        await db[k.Model.VerificationToken].destroy({
            where: {
                expiration_date: {
                    $lte: moment().toDate()
                }
            }
        });
    } catch (e) {
        return e;
    }

    return true;
}

module.exports = clean;
