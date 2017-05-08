/**
 * 20170301094402-writing-answers
 * get-native.com
 *
 * Created by henryehly on 2017/03/01.
 */

const chance          = require('chance').Chance();
const models          = require('../../app/models');
const Promise         = require('bluebird');
const StudySession    = models.StudySession;
const WritingQuestion = models.WritingQuestion;

module.exports = {
    up: function(queryInterface, Sequelize) {
        const promises = [StudySession.min('id'), StudySession.max('id'), WritingQuestion.min('id'), WritingQuestion.max('id')];

        return Promise.all(promises).spread((minStudySessionId, maxStudySessionId, minWritingQuestionId, maxWritingQuestionId) => {
            // todo: try splitting the number of bulk inserts into 3 or 4 so that this array doesn't get too big
            const writingAnswers = [];

            for (let i = minStudySessionId; i <= maxStudySessionId; i++) {
                let answerText = chance.paragraph();

                writingAnswers.push({
                    answer: answerText,
                    words_per_minute: chance.integer({
                        min: 30,
                        max: 50
                    }),
                    word_count: answerText.length,
                    study_session_id: i,
                    writing_question_id: chance.integer({
                        min: minWritingQuestionId,
                        max: maxWritingQuestionId
                    })
                });
            }

            return queryInterface.bulkInsert('writing_answers', writingAnswers);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('writing_answers');
    }
};
