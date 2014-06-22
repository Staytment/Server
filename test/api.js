var expect = require('chai').expect;
var request = require('supertest')('http://localhost:5000');
var db = require('../database');
var users = db.get('users');
var posts = db.get('posts');

describe('API', function () {
  var testuser;
  var otheruser;
  before(function () {
    users.findOne({apiKey: 'thetestuserapikey'}, function (err, doc) {
      testuser = doc;
    });
    users.findOne({apiKey: 'theotheruserapikey'}, function (err, doc) {
      otheruser = doc;
    });
  });

  describe('Authentication', function () {
    it('should allow access without api key', function (done) {
      request.get('/').expect(200, done);
    });
    it('should not allow access with an invalid api key', function (done) {
      request.get('/?api_key=notavalidapikey').expect(403, done);
    });
    it('should allow access with api key via GET parameter api_key', function (done) {
      request.get('/?api_key=thetestuserapikey').expect(200, done);
    });
    it('should allow access with api key via GET parameter apiKey', function (done) {
      request.get('/?apiKey=thetestuserapikey').expect(200, done);
    });

    it('should redirect /auth/google to Google oAuth2', function (done) {
      request.get('/auth/google').expect(302, function (err, res) {
        expect(res.header['location']).to.match(/^https:\/\/accounts.google.com\/o\/oauth2\/auth/);
        done(err);
      });
    });
    it('should redirect /auth/facebook to Facebook oAuth2', function (done) {
      request.get('/auth/facebook').expect(302, function (err, res) {
        expect(res.header['location']).to.match(/^https:\/\/www.facebook.com\/dialog\/oauth/);
        done(err);
      });
    });
//    it('should redirect /auth/twitter to Twitter oAuth1'); //, function (done) {
//      request.get('/auth/twitter').expect(302, function (err, res) {
//        expect(res.header['location']).to.match(/^https:\/\/www.twitter.com\//);
//        done(err);
//      })
//    })
  });

  describe('/posts', function () {
    it('should create a new post and return it on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: 37,
        message: 'Testmessage'
      }).expect(200, function (err, res) {
        var post = res.body;
        expect(post.user).to.equal(testuser._id.toString());
        expect(post.lat).to.equal(13);
        expect(post.long).to.equal(37);
        expect(post.message).to.equal('Testmessage');
        expect(post._id).to.exist;
        done(err);
      });
    });
    it('should not create a new post with missing parameter "lat" on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        long: 37,
        message: 'Testmessage'
      }).expect(400, done);
    });
    it('should not create a new post with missing parameter "long" on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        message: 'Testmessage'
      }).expect(400, done)
    });
    it('should not create a new post with missing parameter "message" on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: 37
      }).expect(400, done);
    });
    it('should not create a new post with parameter "lat" bigger than 90', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 90.1,
        long: 37,
        message: 'Testmessage'
      }).expect(400, done);
    });
    it('should not create a new post with parameter "lat" smaller than -90', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: -90.1,
        long: 37,
        message: 'Testmessage'
      }).expect(400, done);
    });
    it('should not create a new post with parameter "long" bigger than 180', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: 180.1,
        message: 'Testmessage'
      }).expect(400, done);
    });
    it('should not create a new post with parameter "long" smaller than -180', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: -180.1,
        message: 'Testmessage'
      }).expect(400, done);
    });
    it('should not create a new post without an api key', function (done) {
      request.post('/posts/').send({
        lat: 13,
        long: 37,
        message: 'Testmessage'
      }).expect(403, done);
    });
  });
  describe('/posts/:id', function () {
    var my_post_id;
    var other_post_id;
    before(function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 42,
        long: 21,
        message: 'Testmessage'
      }).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          my_post_id = res.body._id;
          request.post('/posts/?apiKey=theotheruserapikey').send({
            lat: 47,
            long: 11,
            message: 'Testmessage'
          }).end(function (err, res) {
            other_post_id = res.body._id;
            done(err);
          });
        }
      });
    });

    it('should delete own posts on HTTP DELETE /posts/:id', function (done) {
//      console.log(my_post_id);
//      console.log(other_post_id);
      request.delete('/posts/' + my_post_id + '?apiKey=thetestuserapikey').expect(204, function (err, res) {
        if (err) {
          done(err);
        } else {
          posts.findOne({'_id': my_post_id}, function (err, doc) {
            expect(doc).to.not.exist;
            done(err);
          });
        }
      });
    });
    it('should forbid deleting foreign posts on HTTP DELETE /posts/:id', function (done) {
      request.delete('/posts/' + other_post_id + '?apiKey=thetestuserapikey').expect(403, function (err, res) {
        if (err) {
          done(err);
        } else {
          posts.findOne({'_id': other_post_id}, function (err, doc) {
            expect(doc).to.exist;
            done(err);
          });
        }
      });
    });
    it('should forbid deleting posts on HTTP DELETE /posts/:id without api key', function (done) {
      request.delete('/posts/' + other_post_id).expect(403, function (err, res) {
        if (err) {
          done(err);
        } else {
          posts.findOne({'_id': other_post_id}, function (err, doc) {
            expect(doc).to.exist;
            done(err);
          });
        }
      });
    });
    it('should return a post on HTTP GET /posts/:id with api key', function (done) {
      request.get('/posts/' + other_post_id + '?apiKey=thetestuserapikey').expect(200, function (err, res) {
        var post = res.body;
        expect(post.lat).to.equal(47);
        expect(post.long).to.equal(11);
        expect(post.message).to.equal('Testmessage');
        expect(post._id).to.exist;
        expect(post.user).to.equal(otheruser._id.toString());
        expect(post.relevance).to.be.a('number');
        done(err);
      });
    });
    it('should return a post on HTTP GET /posts/:id without api key', function (done) {
      request.get('/posts/' + other_post_id).expect(200, function (err, res) {
        var post = res.body;
        expect(post.lat).to.equal(47);
        expect(post.long).to.equal(11);
        expect(post.message).to.equal('Testmessage');
        expect(post._id).to.exist;
        expect(post.user).to.equal(otheruser._id.toString());
        expect(post.relevance).to.be.a('number');
        done(err);
      });
    });
    it('should return 404 when using HTTP GET /posts/:id with an unkown id with api key', function (done) {
      request.get('/posts/deadbeef?apiKey=thetestuserapikey').expect(404, done);
    });
    it('should return 404 when using HTTP GET /posts/:id with an unkown id without api key', function (done) {
      request.get('/posts/deadbeef').expect(404, done);
    });
    it('should return 400 when using HTTP GET /posts/:id with an invalid id with api key', function (done) {
      request.get('/posts/valid_ids_may_only_be_hex_numbers?apiKey=thetestuserapikey').expect(400, done);
    });
    it('should return 400 when using HTTP GET /posts/:id with an invalid id without api key', function (done) {
      request.get('/posts/valid_ids_may_only_be_hex_numbers').expect(400, done);
    });
  });
});