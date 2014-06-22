var expect = require('chai').expect;
var db = require('../database');
var users = db.get('users');
var posts = db.get('posts');

before(function () {
  users.insert({
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  });
  users.insert({
    provider: 'localhost',
    identifier: '1338',
    email: 'someone@localhost',
    name: 'someone else',
    apiKey: 'theotheruserapikey'
  });
});

after(function (done) {
  users.findOne({apiKey: 'thetestuserapikey'}, function (err, testuser) {
    posts.remove({user: testuser._id});
    users.remove(testuser);
    users.findOne({apiKey: 'theotheruserapikey'}, function (err, testuser) {
      posts.remove({user: testuser._id});
      users.remove(testuser);
      done();
    });
  });
});