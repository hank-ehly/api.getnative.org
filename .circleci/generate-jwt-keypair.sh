#!/usr/bin/env bash

set -e

BASENAME=`basename $0`
TMPFILE=`mktemp -t ${BASENAME}.XXXXXX` || exit 1

echo '{"privateKey": "' >> ${TMPFILE}

ssh-keygen -t rsa -N "" -f id_rsa -q
cat id_rsa | sed 's/$/\\n/g' | tr -d '\n' >> ${TMPFILE}

echo '", "publicKey": "' >> ${TMPFILE}

ssh-keygen -f id_rsa.pub -e -m pem > id_rsa.pem
cat id_rsa.pem | sed 's/$/\\n/g' | tr -d '\n' >> ${TMPFILE}

echo '"}' >> ${TMPFILE}

cat ${TMPFILE} | tr -d '\n' > config/secrets/jwt-keypair.json

rm -f ./id_rsa*
rm -f ${TMPFILE}
