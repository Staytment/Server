var db = require('../database');
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var uuid = require('node-uuid');
var crypto = require('crypto');
var users = db.get('users');

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:5000/auth/google/return',
    realm: 'http://localhost:5000/'
  },
  function (identifier, profile, done) {
    users.findOne({provider: 'google', identifier: identifier}, function (err, user) {
      if (!user) {
        var apiKey = crypto.createHash('sha256')
          .update(uuid())
          .update(identifier)
          .digest('hex');
        var user = {
          provider: 'google',
          identifier: identifier,
          email: profile.emails[0]['value'],
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
  app.get('/auth/google', passport.authenticate('google', {session: false}));
  app.get('/auth/google/return', passport.authenticate('google', {session: false}), function (req, res) {
    res.json(req.user);
  });
};