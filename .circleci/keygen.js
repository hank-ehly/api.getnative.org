#!/usr/bin/env node

const util = require('util');
const exec = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const keyname = '__tmpkey';
const output = process.argv[2];

if (!output) {
    console.log('First argument must be a filename.');
    process.exit(1);
} else if (fs.existsSync(output) && fs.statSync(output).isDirectory()) {
    console.log('Output path cannot be a directory.');
    process.exit(1);
}

try {
    clean();

    exec(`ssh-keygen -t rsa -N "" -f ${keyname} -q`);

    const keys = {};
    keys.private = fs.readFileSync(keyname, 'UTF8').replace(/\n/g, '\n');
    keys.public = exec(`ssh-keygen -f ${keyname}.pub -e -m pem`).toString().replace(/\n/g, '\n');

    fs.writeFileSync(output, JSON.stringify(keys), {encoding: 'UTF8'});

    clean();
} catch (e) {
    console.log(e);
}

function clean() {
    [keyname, keyname + '.pub'].forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    });
}
