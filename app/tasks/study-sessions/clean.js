const k = require('../../../config/keys.json');
const db = require('../../models');

const moment = require('moment');
const _ = require('lodash');

async function clean() {
    const t = await db.sequelize.transaction();

    try {
        const yesterday = moment().subtract(1, 'days').toDate();

        const studySessions = await db[k.Model.StudySession].findAll({
            attributes: [k.Attr.Id],
            where: {
                is_completed: false,
                created_at: {
                    $lt: yesterday
                }
            },
            transaction: t
        });

        const plainStudySessions = _.invokeMap(studySessions, 'get', {plain: true});
        const studySessionIds = _.map(plainStudySessions, 'id');

        await db[k.Model.WritingAnswer].destroy({
            where: {
                study_session_id: {
                    $in: studySessionIds
                }
            },
            transaction: t
        });

        await db[k.Model.StudySession].destroy({
            where: {
                is_completed: false,
                created_at: {
                    $lt: yesterday
                }
            },
            transaction: t
        });

        await t.commit();
        process.exit(0);
        return true;
    } catch (e) {
        await t.rollback();
        console.log(e);
        return e;
    }
}

module.exports = clean;
