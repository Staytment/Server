var db = require(__dirname+'/../database');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var uuid = require('node-uuid');
var crypto = require('crypto');
var users = db.get('users');

//passport.use(new GoogleStrategy({
//    returnURL: (process.env.DOMAIN_API || 'http://localhost:5000/') + 'auth/google/return',
//    realm: process.env.DOMAIN_API || 'http://localhost:5000/'
//  },
//  function (identifier, profile, done) {
//    users.findOne({provider: 'google', identifier: identifier}, function (err, user) {
//      if (!user) {
//        var apiKey = crypto.createHash('sha256')
//          .update(uuid())
//          .update(identifier)
//          .digest('hex');
//        var user = {
//          provider: 'google',
//          identifier: identifier,
//          emails: profile.emails,
//          apiKey: apiKey
//        };
//        users.insert(user);
//      }
//      done(err, user);
//    });
//  }
//));

passport.use(new GoogleStrategy({
    clientID: '832914506447-ht3vms2nufelbajlgjkhorv2vj9b2v71.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_OAUTH_SECRET || 'deadbeef',
    callbackURL: (process.env.DOMAIN_API || 'http://localhost:5000') + '/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    users.findOne({provider: 'google', identifier: profile.id}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(profile.id)
          .digest('hex');
        user = {
          provider: 'google',
          identifier: profile.id,
          email: profile._json.email,
          name: profile.displayName,
          picture: profile._json.picture,
          apiKey: apiKey
        };
        users.insert(user);
      }
      done(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: '629317600482580',
    clientSecret: process.env.FACEBOOK_OAUTH_SECRET || 'deadbeef',
    callbackURL: (process.env.DOMAIN_API || 'http://localhost:5000') + '/auth/facebook/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    users.findOne({provider: 'facebook', identifier: profile.id}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(profile.id)
          .digest('hex');
        user = {
          provider: 'facebook',
          identifier: profile.id,
          email: profile._json.email,
          name: profile.displayName,
          apiKey: apiKey
        };
        users.insert(user);
      }
      done(err, user);
    });
  }
));


module.exports = function (app) {
  app.use(passport.initialize());
//  app.get('/auth/google', passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login', session: false}));
  app.get('/auth/google', passport.authenticate('google', {scope: 'email', session: false}));
  app.get('/auth/google/callback', passport.authenticate('google', {session: false}), function (req, res) {
    res.json(req.user);
  });
  app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email user_likes', session: false}));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {session: false}), function (req, res) {
    res.json(req.user);
  });
};
