/**
 * base
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/30.
 */

const k = require('../keys.json');

const defaults = {};

defaults[k.API.Port] = 3000;
defaults[k.API.Hostname] = 'localhost';

defaults[k.Client.BaseURI] = 'http://localhost:5555';
defaults[k.Client.Host] = 'localhost:5555';
defaults[k.Client.Protocol] = 'http';

defaults[k.DefaultLocale] = 'en';

defaults[k.EmailAddress.NoReply] = 'noreply@localhost';
defaults[k.EmailAddress.Contact] = 'contact@foobar.com';

defaults[k.GoogleCloud.ProjectId] = 'get-native';
defaults[k.GoogleCloud.StorageBucketName] = 'mock-bucket-name';

defaults[k.ImageFileExtension] = 'jpg';

defaults[k.OAuth.Facebook.ClientID] = 'xxx';
defaults[k.OAuth.Facebook.ClientSecret] = 'xxx';
defaults[k.OAuth.Facebook.CallbackURL] = 'http://localhost:3000/oauth/facebook/callback';
defaults[k.OAuth.Twitter.ConsumerKey] = 'xxx';
defaults[k.OAuth.Twitter.ConsumerSecret] = 'xxx';
defaults[k.OAuth.Twitter.CallbackURL] = 'http://localhost:3000/oauth/twitter/callback';
defaults[k.OAuth.Google.ClientID] = 'xxx';
defaults[k.OAuth.Google.ClientSecret] = 'xxx';
defaults[k.OAuth.Google.CallbackURL] = 'http://localhost:3000/oauth/google/callback';

defaults[k.SMTP.Port] = 1025;
defaults[k.SMTP.Host] = 'localhost';

defaults[k.SNS.FacebookPageURL] = 'https://www.facebook.com/getnativelearning';
defaults[k.SNS.TwitterPageURL] = 'https://twitter.com/getnativeweb';
defaults[k.SNS.YouTubeChannelURL] = 'https://www.youtube.com/channel/UCz_j0iuKIXdyAb6nSSHLswQ';

defaults[k.VideoFileExtension] = 'mp4';

module.exports = defaults;
