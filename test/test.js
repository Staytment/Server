var expect = require('chai').expect;
var db = require('../database');
var users = db.get('users');

before(function () {
  var user = {
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  };
  users.insert(user);
});

after(function () {
  users.remove({apiKey: 'thetestuserapikey'});
});