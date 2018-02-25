#!/usr/bin/env bash

if [ -z ${1} ]; then
    echo "A branch name is required for deployment."
    exit 1
fi

if [ ${1} != "master" -a ${1} != "develop" ]; then
    echo "The only available stages are 'staging' and 'production'. You chose ${1}."
    exit 1
fi

[[ ${1} = "master" ]] && stage="production" || stage="staging"

git clone git@github.com:hank-ehly/devops.getnativelearning.com.git
cd devops.getnativelearning.com/deploy && bundle install --jobs 4 --retry 3 --path vendor/bundle && bundle exec cap server:${stage} deploy
