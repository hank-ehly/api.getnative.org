const db = require('../../models');
const k = require('../../../config/keys.json');

const moment = require('moment');
const _ = require('lodash');

async function clean() {
    const t = await db.sequelize.transaction();

    try {
        const emailChangeRequestIds = [];

        let verificationTokens = await db[k.Model.VerificationToken].findAll({
            attributes: [k.Attr.Id],
            where: {
                expiration_date: {
                    $lte: moment().toDate()
                }
            },
            include: [
                {
                    model: db[k.Model.EmailChangeRequest],
                    required: true,
                    attributes: [k.Attr.Id],
                    as: 'email_change_requests'
                }
            ]
        });

        verificationTokens = _.invokeMap(verificationTokens, 'get', {plain: true});

        for (let i = 0; i < verificationTokens.length; i++) {
            for (let j = 0; j < verificationTokens[i].email_change_requests.length; j++) {
                emailChangeRequestIds.push(verificationTokens[i].email_change_requests[j][k.Attr.Id]);
            }
        }

        await db[k.Model.EmailChangeRequest].destroy({
            where: {
                id: {
                    $in: emailChangeRequestIds
                }
            },
            transaction: t
        });

        await db[k.Model.VerificationToken].destroy({
            where: {
                expiration_date: {
                    $lte: moment().toDate()
                }
            },
            transaction: t
        });

        await t.commit();
        process.exit(0);
        return true;
    } catch (e) {
        await t.rollback();
        return e;
    }
}

module.exports = clean;
