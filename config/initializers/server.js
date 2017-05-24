/**
 * server
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const middleware = require('../../app/middleware');
const config     = require('../application').config;
const routes     = require('../routes');
const logger     = require('../logger');
const i18n       = require('../i18n');
const k          = require('../keys.json');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport   = require('passport');
const Promise    = require('bluebird');
const express    = require('express');
const morgan     = require('morgan');
const path       = require('path');

passport.use('facebook', require('../passport/facebook'));
passport.use('twitter', require('../passport/twitter'));
passport.use('custom', require('../passport/custom'));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

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
    app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
    app.use(cookieParser());
    app.use(i18n.init);
    app.use(middleware['Cors']);

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(routes);

    app.use(middleware['Error'].logErrors);
    app.use(middleware['Error'].clientErrorHandler);
    app.use(middleware['Error'].fallbackErrorHandler);

    return new Promise(resolve => {
        const port = config.get(k.API.Port);
        resolve(app.listen(port, () => logger.info(`Listening on port ${port}`)));
    });
};
