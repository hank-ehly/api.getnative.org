/**
 * server
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const middleware = require('../../app/middleware');
const config     = require('../index');
const routes     = require('../routes');
const logger     = require('../logger');
const i18n       = require('../i18n');
const k          = require('../keys.json');

const express    = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan     = require('morgan');
const Promise    = require('bluebird');
const path       = require('path');

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
    app.use(cookieParser());
    app.use(i18n.init);
    app.use(middleware.Cors);

    app.use(routes);

    app.use(middleware.Error.logErrors);
    app.use(middleware.Error.clientErrorHandler);
    app.use(middleware.Error.fallbackErrorHandler);

    return new Promise(resolve => {
        const port = config.get(k.API.Port);
        resolve(app.listen(port, () => logger.info(`Listening on port ${port}`)));
    });
};
