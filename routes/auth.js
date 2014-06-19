var db = require('../database');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
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
    clientID: '832914506447-31krh9ifqmk2pkmedfdjcsdt8ge8i8r0.apps.googleusercontent.com',
    clientSecret: '_20kaK7yOD1DnMPk_OUANc0k',
    callbackURL: (process.env.DOMAIN_API || 'http://localhost:5000/') + 'auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    users.findOne({provider: 'google', identifier: profile.id}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(profile.id)
          .digest('hex');
        var user = {
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
    clientSecret: '67c60db7bbccb529e836386cbfced480',
    callbackURL: (process.env.DOMAIN_API || 'http://localhost:5000/') + 'auth/facebook/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    users.findOne({provider: 'facebook', identifier: profile.id}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(profile.id)
          .digest('hex');
        var user = {
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

passport.use(new TwitterStrategy({
    consumerKey: 'z37mM6PwnBKSvBLZEjMQMPSCg',
    consumerSecret: 'wUok4JZoRMp5GVDSxi2ri7CPTeQcXCoFYlXX5935kwKRhEQRXN',
    callbackURL: (process.env.DOMAIN_API || 'http://localhost:5000/') + 'auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    users.findOne({provider: 'twitter', identifier: profile.id}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(profile.id)
          .digest('hex');
        var user = {
          provider: 'twitter',
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
  app.get('/auth/twitter', passport.authenticate('twitter', {scope: 'email', session: false}));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', {session: false}), function (req, res) {
    res.json(req.user);
  });
};