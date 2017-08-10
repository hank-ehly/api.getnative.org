#!/usr/bin/env bash

if [ -z ${1} ]; then
		echo "Branch name required."
		exit 1
fi

if [ "${1}" == "develop" ]; then
		git clone git@github.com:hank-ehly/devops.getnativelearning.com.git
		cd devops.getnativelearning.com/deploy && rbenv install --verbose && gem install bundler && bundle install --jobs 4 --retry 3 --path vendor/bundle && bundle exec cap server:staging deploy
elif [ "${1}" == "master" ]; then
		git clone git@github.com:hank-ehly/devops.getnativelearning.com.git
		cd devops.getnativelearning.com/deploy && rbenv install --verbose && gem install bundler && bundle install --jobs 4 --retry 3 --path vendor/bundle && bundle exec cap server:production deploy
fi
