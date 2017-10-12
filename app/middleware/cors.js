/**
 * cors
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/22.
 */

const express = require('express');
const config = require('../../config/application').config;
const logger = require('../../config/logger');
const router = express.Router();
const k = require('../../config/keys.json');

router.use((req, res, next) => {
    if (/^\/healthcheck$/.test(req.url)) {
        return next();
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': 'null',
        'Access-Control-Expose-Headers': 'X-GN-Auth-Token, X-GN-Auth-Expire, Location',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-XSRF-TOKEN',
        'Access-Control-Allow-Methods': 'PATCH, DELETE'
    };

    if (config.isDev()) {
        corsHeaders['Access-Control-Allow-Origin'] = '*';
    } else if (/^(https:\/\/(.+\.)*getnativelearning\.com(?::\d{1,5})?)$/.test(req.headers.origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = req.headers.origin;
    }

    res.set(corsHeaders);
    res.append('Vary', 'Origin');

    next();
});

module.exports = router;
