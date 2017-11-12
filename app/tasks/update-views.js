/**
 * update-views
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/11/12.
 */

const util = require('util');
const readFile = util.promisify(require('fs').readFile);
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const url = require('url');
const db = require('../models');
const k = require('../../config/keys.json');

const logTimeFormat = 'DD/MMM/YYYY:HH:mm:ss';
const IP_ADDRESS = 0;
const REQUEST_TIME = 3;
const REQUEST_METHOD = 5;
const REQUEST_URI = 6;

async function updateViews(logPath) {
    return readFile(logPath, 'UTF8').then(async function(logStr) {
        // console.log(`Working with file at ${logPath}`);

        let lines = logStr.split('\n');

        lines = _.map(lines, ln => {
            let splitLn = ln.split(' ');

            const ipAddress = _.get(splitLn, IP_ADDRESS);
            const requestMethod = _.trimStart(_.get(splitLn, REQUEST_METHOD), "\"");

            let requestTime = _.trimStart(_.get(splitLn, REQUEST_TIME), '[');
            requestTime = moment(requestTime, logTimeFormat);

            const requestUri = _.get(splitLn, REQUEST_URI);
            const pathname = url.parse(requestUri, false).pathname;
            const videoId = _.last(_.split(pathname, '/'));

            return {
                ipAddress: ipAddress,
                requestTime: requestTime,
                requestMethod: requestMethod,
                videoId: videoId
            };
        });

        lines = _.filter(lines, ln => {
            return ln.requestMethod === 'GET' && ln.requestTime.isBetween(moment().subtract(1, 'day'), moment.now());
        });

        lines = _.uniqBy(lines, 'ipAddress');

        const videoViews = _.countBy(lines, 'videoId');

        const t = await db.sequelize.transaction();
        try {
            for (let videoId in videoViews) {
                if (videoViews.hasOwnProperty(videoId)) {
                    let currentVideo = await db[k.Model.Video].findByPrimary(videoId, {
                        attributes: [k.Attr.LoopCount],
                        transaction: t,
                        rejectOnEmpty: false
                    });

                    if (!currentVideo) {
                        continue;
                    }

                    let currentLoopCount = currentVideo.get(k.Attr.LoopCount);

                    const newLoopCount = currentLoopCount + videoViews[videoId];

                    await db[k.Model.Video].update({loop_count: newLoopCount}, {
                        where: {id: videoId},
                        transaction: t
                    });

                    console.log(`VIDEO(${videoId}) ${currentLoopCount} -> ${newLoopCount}`);
                }
            }
            await t.commit();
            return true;
        } catch (e) {
            await t.rollback();
            console.log(e);
            return e;
        }
    });
}

module.exports = updateViews;
