var expect = require('chai').expect;
var db = require('../database');
var users = db.get('users');
var posts = db.get('posts');

before(function () {
  posts.remove();
  users.insert({
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  });
});

after(function () {
  posts.remove();
  users.remove({apiKey: 'thetestuserapikey'});
});