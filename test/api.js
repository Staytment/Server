var expect = require('chai').expect;
var request = require('supertest')('http://localhost:5000');
var db = require('../database');
var users = db.get('users');

describe('API', function () {
  var testuser;
  before(function () {
    users.findOne({apiKey: 'thetestuserapikey'}, function (err, doc) {
      testuser = doc._id.toString();
    });
  });

  describe('Authentication', function () {
    it('should not allow access without api key', function (done) {
      request.get('/').expect(403, '{"message":"forbidden","code":403}', done);
    });
    it('should not allow access with an invalid api key', function (done) {
      request.get('/?api_key=notavalidapikey').expect(403, '{"message":"forbidden","code":403}', done);
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
  });

  describe('/posts', function () {
    it('should create a new post and return it on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: 37,
        message: 'Testmessage'
      }).expect(200, function (err, res) {
        var post = res.body;
        expect(post.user).to.equal(testuser);
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
      }).expect(400, function (err, res) {
        expect(res.body.code).to.equal(400);
        expect(res.body.message).to.equal('invalid lat');
        done(err);
      });
    });
    it('should not create a new post with missing parameter "long" on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        message: 'Testmessage'
      }).expect(400, function (err, res) {
        expect(res.body.code).to.equal(400);
        expect(res.body.message).to.equal('invalid long');
        done(err);
      });
    });
    it('should not create a new post with missing parameter "message" on POST', function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        lat: 13,
        long: 37
      }).expect(400, function (err, res) {
        expect(res.body.code).to.equal(400);
        expect(res.body.message).to.equal('invalid message');
        done(err);
      });
    });
    it('should not create a new post with parameter "lat" bigger than 90');
    it('should not create a new post with parameter "lat" smaller than -90');
    it('should not create a new post with parameter "long" bigger than 180');
    it('should not create a new post with parameter "long" smaller than -180');
  });
  describe('/posts/:id', function () {
    it('should delete own posts on HTTP DELETE /posts/:id');
    it('should forbid deleting foreign posts on HTTP DELETE /posts/:id');
    it('should return a post on HTTP GET /posts/:id');
    it('should return 404 - Not Found when using HTTP GET /posts/:id with an invalid id')
  });
});