var expect = require('chai').expect;
var logfmt = require('logfmt');
var db = require(__dirname + '/../database');
var users = db.get('users');
var posts = db.get('posts');
var app = require(__dirname + '/../app');
var Q = require('q');

logfmt.stream = {write: function(){}};

var insertUser = function(val) { return Q.ninvoke(users, 'insert', val); };
var insertPost = function(val) { return Q.ninvoke(posts, 'insert', val); };


before(function (done) {
  this.timeout(10000);

  insertUser({
    provider: 'localhost',
    identifier: '1337',
    email: 'test@localhost',
    name: 'testuser',
    apiKey: 'thetestuserapikey'
  })
  .then(function(){
    return insertUser({
      provider: 'localhost',
      identifier: '1338',
      email: 'someone@localhost',
      name: 'someone else',
      apiKey: 'theotheruserapikey'
    });
  })
  .then(function(){
    return insertUser({
      provider: 'localhost',
      identifier: '1339',
      email: 'someoneelse@localhost',
      name: 'someone else',
      apiKey: 'yetanotherkey'
    });
  })
  .then(function(testuser){
    var insertPostPromises = [];
    for (var lat = -90; lat < 90; lat+=2) {
      for (var long = -180; long < 180; long+=2) {
        var promise = insertPost({
          type: 'Feature',
          geometry : {
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
        insertPostPromises.push(promise);
      }
    }

    Q.all(insertPostPromises)
    .then(function(){
      var port = 5001;
      app.listen(port, function () {
       done();
     });
   });
  }, function(err){
    done(err);
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
