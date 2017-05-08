/**
 * cors
 * get-native.com
 *
 * Created by henryehly on 2017/01/22.
 */

const express = require('express');
const config  = require('../../config');
const logger  = require('../../config/logger');
const router  = express.Router();
const k = require('../../config/keys.json');

const corsHeaders = {
    'Access-Control-Allow-Origin': config.get(k.Header.AccessControlAllowOrigin),
    'Access-Control-Expose-Headers': 'X-GN-Auth-Token, X-GN-Auth-Expire',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PATCH'
};

logger.info(`Set response header: 'Access-Control-Allow-Origin': '${config.get(k.Header.AccessControlAllowOrigin)}'`);

router.use((req, res, next) => {
    res.set(corsHeaders);
    next();
});

module.exports = router;
