var expect = require('chai').expect;
var db = require(__dirname + '/../database');
var users = db.get('users');
var posts = db.get('posts');
var app = require(__dirname + '/../app');


before(function (done) {
  users.insert({
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  }, function () {
    users.insert({
      provider: 'localhost',
      identifier: '1338',
      email: 'someone@localhost',
      name: 'someone else',
      apiKey: 'theotheruserapikey'
    }, function () {
      users.insert({
        provider: 'localhost',
        identifier: '1339',
        email: 'someoneelse@localhost',
        name: 'someone else',
        apiKey: 'yetanotherkey'

      }, function (err, testuser) {
        if (err) {
          done(err);
          return;
        }
        for (var lat = -90; lat < 90; lat += 2) {
          for (var long = -180; long < 180; long += 2) {
            posts.insert({
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
                  _id: testuser._id,
                  name: testuser.name
                }
              }
            });
          }
        }
        var port = 5000;
        app.listen(port, function () {
          done();
        });
      });
    });
  });
});

after(function (done) {
  users.findOne({apiKey: 'thetestuserapikey'}, function (err, testuser) {
    posts.remove({user: testuser._id});
    users.remove(testuser);
    users.findOne({apiKey: 'theotheruserapikey'}, function (err, testuser) {
      posts.remove({user: testuser._id});
      users.remove(testuser);
      users.findOne({apiKey: 'yetanotherkey'}, function (err, testuser) {
        posts.remove({user: testuser._id});
        users.remove(testuser);
        done();
      });
    });
  });
});