var expect = require('chai').expect;
var logfmt = require('logfmt');
var db = require(__dirname + '/../database');
var users = db.get('users');
var posts = db.get('posts');
var app = require(__dirname + '/../app');
var Q = require('q');

logfmt.stream = {write: function () {
}};

var insertUser = function (val) {
  return Q.ninvoke(users, 'insert', val);
};
var insertPost = function (user, long, lat) {
  return Q.ninvoke(posts, 'insert', {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [long, lat]
    },
    properties: {
      message: 'Hello',
      tags: [],
      relevance: 100,
      user: {
        _id: user._id,
        name: user.name
      }
    }
  });
};


before(function (done) {
  this.timeout(100000);
  // database cleanup
  users.remove();
  posts.remove();

  insertUser({
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  })
    .then(function () {
      return insertUser({
        provider: 'localhost',
        identifier: '1338',
        email: 'someone@localhost',
        name: 'someone else',
        apiKey: 'theotheruserapikey'
      });
    })
    .then(function () {
      return insertUser({
        provider: 'localhost',
        identifier: '1339',
        email: 'someoneelse@localhost',
        name: 'someone else',
        apiKey: 'yetanotherkey'
      });
    })
    .then(function (testuser) {
      var insertPostPromises = [];
      var lat;
      var long;
      var promise;
      for (lat = -90; lat < 90; lat += 1) {
        for (long = -180; long < 180; long += 1) {
          promise = insertPost(testuser, long, lat);
          insertPostPromises.push(promise);
        }
      }
      for (lat = 47; lat < 53; lat += 0.1) {
        for (long = 8; long < 13; long += 0.1) {
          promise = insertPost(testuser, long, lat);
          insertPostPromises.push(promise);
        }
      }

      Q.all(insertPostPromises)
        .then(function () {
          var port = 5001;
          app.listen(port, function () {
            done();
          });
        });
    }, function (err) {
      done(err);
    });
});

after(function (done) {
  done();
});
