/**
 * server
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/18.
 */

const cors = require('../../app/middleware/cors');
const error = require('../../app/middleware/error');
const config = require('../application').config;
const routes = require('../routes');
const logger = require('../logger');
const i18n = require('../i18n');
const k = require('../keys.json');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

for (let provider of ['custom', 'facebook', 'twitter', 'google']) {
    passport.use(provider, require('../passport/' + provider));
}

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

module.exports = () => {
    const app = express();

    if (config.get(k.NODE_ENV) === k.Env.Development) {
        app.use(morgan('dev'));
    }

    for (let key of ['x-powered-by', 'etag']) {
        app.disable(key);
    }

    app.set('views', path.resolve(__dirname, '..', '..', 'app', 'templates'));
    app.set('view engine', 'ejs');

    app.use(bodyParser.json());
    app.use(require('express-session')({secret: 'x-gn-s', resave: true, saveUninitialized: true}));
    app.use(cookieParser());
    app.use(i18n.init);
    app.use(cors);

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(routes);

    app.use(error.logErrors);
    app.use(error.clientErrorHandler);
    app.use(error.fallbackErrorHandler);

    return new Promise(resolve => {
        const port = config.get(k.API.Port);
        resolve(app.listen(port, () => logger.info(`Listening on port ${port}`)));
    });
};
