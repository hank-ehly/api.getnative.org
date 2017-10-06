/**
 * backup-db
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/10/07.
 */

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dbConf = require('../../config/database.json');
const env = process.env.NODE_ENV;
const _ = require('lodash');
const k = require('../../config/keys.json');
const path = require('path');

if (!_.has(dbConf, env)) {
    throw new Error(`env '${env}' not found in db config file.`);
}

const cnf = dbConf[env];
const timestamp = Math.floor(+(new Date()) / 1000);

async function dump() {
    const outPath = path.resolve(process.env.HOME, `${cnf.database}_${timestamp}.sql.gz`);
    await exec(`mysqldump -u ${cnf.username} --password=${cnf.password} ${cnf.database} 2>/dev/null | gzip > ${outPath}`);
    return outPath;
}

module.exports = dump;