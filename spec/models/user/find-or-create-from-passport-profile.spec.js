/**
 * find-or-create-from-passport-profile.spec
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/25.
 */

const mocha    = require('mocha');
const describe = mocha.describe;
const it       = mocha.it;

describe('User.findOrCreateFromPassportProfile', function() {
    // { // given this data
    //     id: '2545994211381',
    //     displayName: 'Hank Ehly',
    //     emails: [{value: 'henry.ehly@gmail.com'}],
    //     photos: [{value: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/16807431_2546476943449_5422516981354096077_n.jpg?oh=8670d7a5566fe6ea2237da52be7ecef5&oe=599EA663'}],
    //     provider: 'facebook' / 'twitter'
    // }

    // check if another user exists with the same email
    // IF: exists
    //     IF: that user has a 'facebook' identity
    //     THEN: get the user data and invoke the callback
    //     ELSE: create a 'facebook' identity for the user and invoke the callback with the user data
    // IF: not exists
    // THEN: create a user record and identity record of 'facebook' type && invoke callback with user data

    // it('profile pic?')

    describe('given a completely new user', function() {
        it('should create a new User record');
    });

    describe('given an existing user without a matching identity', function() {
        it('should create a new identity for the given provider');
        it('should create a new identity with the correct AuthAdapterType');
        it('should create a new identity with the correct auth_adapter_user_id');
        it('should create a new identity linked to the correct User record');
    });

    describe('given a user with an existing Identity', function() {
        it('should return the existing user data from the database');
    });

    describe('given an profile object', function() {
        it('should throw a ReferenceError if profile.id is missing');
        it('should throw a ReferenceError if profile.provider is missing');
        it('should throw a ReferenceError if profile.displayName is missing');
        it('should throw a ReferenceError if profile.emails[0].value is missing');
    });
});
