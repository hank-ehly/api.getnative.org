/**
 * index
 * get-native.com
 *
 * Created by henryehly on 2017/01/18.
 */

const users = require('./users');
const auth = require('./auth');
const categories = require('./categories');
const sessions = require('./sessions');
const speakers = require('./speakers');
const study = require('./study');
const subcategories = require('./subcategories');
const videos = require('./videos');

module.exports = {
    users: users,
    auth: auth,
    categories: categories,
    sessions: sessions,
    speakers: speakers,
    study: study,
    subcategories: subcategories,
    videos: videos
};
