/**
 * authenticate
 * api.get-native.com
 *
 * Created by henryehly on 2017/05/11.
 */

const passport = require('passport');

module.exports = passport.authenticate(['custom', 'facebook', 'twitter']);
