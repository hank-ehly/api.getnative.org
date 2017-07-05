const k = require('../../../config/keys.json');
const db = require('../../models');

const moment = require('moment');
const _ = require('lodash');

async function clean() {
    try {
        const yesterday = moment().subtract(1, 'days').toDate();

        const studySessions = await db[k.Model.StudySession].findAll({
            attributes: [k.Attr.Id],
            where: {
                is_completed: false,
                created_at: {
                    $lt: yesterday
                }
            }
        });

        const plainStudySessions = _.invokeMap(studySessions, 'get', {plain: true});
        const studySessionIds = _.map(plainStudySessions, 'id');

        await db[k.Model.WritingAnswer].destroy({
            where: {
                study_session_id: {
                    $in: studySessionIds
                }
            }
        });

        await db[k.Model.StudySession].destroy({
            where: {
                is_completed: false,
                created_at: {
                    $lt: yesterday
                }
            }
        });
    } catch (e) {
        return e;
    }

    return true;
}

module.exports = clean;
