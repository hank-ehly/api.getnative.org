#!/usr/bin/env node

const path      = require('path');
const config    = require('../../../config/application').config;
const k         = require('../../../config/keys.json');
const dbconf    = require(path.resolve(__dirname, '..', '..', '..', 'config', 'database.json'))[config.get(k.ENVIRONMENT)];

const Sequelize = require('sequelize');
const util      = require('util');
const readFile  = util.promisify(require('fs').readFile);

dbconf.dialectOptions = {
    multipleStatements: true
};

const sequelize = new Sequelize(dbconf.database, dbconf.username, dbconf.password, dbconf);
return readFile(path.resolve(__dirname, 'clean.sql'), 'utf8').then(sequelize.query);
