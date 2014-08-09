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
  });

  describe('/posts', function () {
    describe('HTTP GET', function () {
      describe('without API key', function () {
        it('should return 200 OK', function (done) {
          request.get('/posts/').expect(200, done);
        });
        it('should not return more than 25 posts', function (done) {
          request.get('/posts/').expect(200, function (err, res) {
            var posts = res.body;
            expect(posts.length).to.be.lessThan(26);
            done(err);
          });
        });
        it('should not return more than 10 posts if parameter "limit=10" is passed', function (done) {
          request.get('/posts/?limit=10').expect(200, function (err, res) {
            var posts = res.body;
            expect(posts.length).to.be.lessThan(11);
            done(err);
          });
        });
        it('should return posts with a coordinate pair', function (done) {
          request.get('/posts/').expect(200, function (err, res) {
            var posts = res.body;
            var post = posts[0];
            expect(post.geometry.coordinates.length).to.equal(2);
            done(err);
          });
        });
        it('should return posts with a message text', function (done) {
          request.get('/posts/').expect(200, function (err, res) {
            var posts = res.body;
            var post = posts[0];
            expect(post.properties.message).to.exist;
            done(err);
          });
        });
        it('should return posts with a username and an id', function (done) {
          request.get('/posts/').expect(200, function (err, res) {
            var posts = res.body;
            var post = posts[0];
            expect(post.properties.user._id).to.exist;
            expect(post.properties.user.name).to.exist;
            done(err);
          });
        });
        it('should return 400 BAD REQUEST if parameter "limit" is above 25', function (done) {
          request.get('/posts/?limit=26').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is 0', function (done) {
          request.get('/posts/?limit=0').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is negative', function (done) {
          request.get('/posts/?limit=-10').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a letter', function (done) {
          request.get('/posts/?limit=a').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a text', function (done) {
          request.get('/posts/?limit=abcde').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a text with special characters', function (done) {
          request.get('/posts/?limit=äöüß').expect(400, done);
        });
      });
      describe('with API key', function () {
        it('should return 200 OK', function (done) {
          request.get('/posts/?apiKey=thetestuserapikey').expect(200, done);
        });
        it('should not return more than 25 posts', function (done) {
          request.get('/posts/?apiKey=thetestuserapikey').expect(200, function (err, res) {
            var posts = res.body;
            expect(posts.length).to.be.lessThan(26);
            done(err);
          });
        });
        it('should not return more than 10 posts if parameter "limit=10" is passed', function (done) {
          request.get('/posts/?limit=10&apiKey=thetestuserapikey').expect(200, function (err, res) {
            var posts = res.body;
            expect(posts.length).to.be.lessThan(11);
            done(err);
          });
        });
        it('should return posts with a coordinate pair', function (done) {
          request.get('/posts/?apiKey=thetestuserapikey').expect(200, function (err, res) {
            var posts = res.body;
            var post = posts[0];
            expect(post.geometry.coordinates.length).to.equal(2);
            done(err);
          });
          it('should return posts with a message text', function (done) {
            request.get('/posts/?apiKey=thetestuserapikey').expect(200, function (err, res) {
              var posts = res.body;
              var post = posts[0];
              expect(post.message).to.exist;
              done(err);
            });
          });
          it('should return posts with a username and an id', function (done) {
            request.get('/posts/?apiKey=thetestuserapikey').expect(200, function (err, res) {
              var posts = res.body;
              var post = posts[0];
              expect(post.user._id).to.exist;
              expect(post.user.name).to.exist;
              done(err);
            });
          });
        });
        it('should return 400 BAD REQUEST if parameter "limit" is above 25', function (done) {
          request.get('/posts/?limit=26?apiKey=thetestuserapikey').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is 0', function (done) {
          request.get('/posts/?limit=0?apiKey=thetestuserapikey').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is negative', function (done) {
          request.get('/posts/?limit=-10?apiKey=thetestuserapikey').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a letter', function (done) {
          request.get('/posts/?limit=a?apiKey=thetestuserapikey').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a text', function (done) {
          request.get('/posts/?limit=abcde?apiKey=thetestuserapikey').expect(400, done);
        });
        it('should return 400 BAD REQUEST if parameter "limit" is a text with special characters', function (done) {
          request.get('/posts/?limit=äöüß?apiKey=thetestuserapikey').expect(400, done);
        });
      });
    });
    describe('HTTP POST', function () {
      describe('without API key', function () {
        it('should return 403 FORBIDDEN', function (done) {
          request.post('/posts/').send({
            coordinates: [13, 37],
            message: 'Testmessage'
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN with one coordinate', function (done) {
          request.post('/posts/').send({
            coordinates: [13],
            message: 'Testmessage'
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN with three coordinates', function (done) {
          request.post('/posts/').send({
            coordinates: [13, 37, 42],
            message: 'Testmessage'
          }).expect(403, done)
        });
        it('should return 403 FORBIDDEN with missing parameter "message"', function (done) {
          request.post('/posts/').send({
            coordinates: [13, 37]
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN if latitude is above 90', function (done) {
          request.post('/posts/').send({
            coordinates: [13, 90.1],
            message: 'Testmessage'
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN if latitude is below -90', function (done) {
          request.post('/posts/').send({
            coordinates: [13, -90.1],
            message: 'Testmessage'
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN if longitude is above 180', function (done) {
          request.post('/posts/').send({
            coordinates: [180.1, 37],
            message: 'Testmessage'
          }).expect(403, done);
        });
        it('should return 403 FORBIDDEN if longitude is below -180', function (done) {
          request.post('/posts/').send({
            coordinates: [-180.1, 37],
            message: 'Testmessage'
          }).expect(403, done);
        });
      });
      describe('with API key', function () {
        it('should return 200 OK and return the created post', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13, 37],
            message: 'Testmessage'
          }).expect(200, function (err, res) {
            var post = res.body;
            expect(post.type).to.equal('Feature');
            expect(post.properties.message).to.equal('Testmessage');
            expect(post.properties.user._id).to.equal(testuser._id.toString());
            expect(post.properties.user.name).to.equal(testuser.name);
            expect(post.properties.relevance).to.be.a('number');
            expect(post.geometry.type).to.equal('Point');
            expect(post.geometry.coordinates).to.eql([13, 37]);

            done(err);
          });
        });
        it('should return 400 BAD REQUEST with one coordinate', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST with three coordinate', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13, 37, 42],
            message: 'Testmessage'
          }).expect(400, done)
        });
        it('should return 400 BAD REQUEST with missing parameter "message"', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13, 37]
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if latitude is above 90', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13, 90.1],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if latitude is below -90', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [13, -90.1],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if longitude is above 180', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [180.1, 37],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if longitude is below -180', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [-180.1, 37],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if coordinates contains strings', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: ['hello', 'world'],
            message: 'Testmessage'
          }).expect(400, done);
        });
        it('should return 400 BAD REQUEST if coordinates contains lists', function (done) {
          request.post('/posts/?apiKey=thetestuserapikey').send({
            coordinates: [[2, 3], [4, 5]],
            message: 'Testmessage'
          }).expect(400, done);
        });
      });
    });
  });
  describe('/posts/:id', function () {
    var my_post_id;
    var other_post_id;
    before(function (done) {
      request.post('/posts/?apiKey=thetestuserapikey').send({
        coordinates: [21, 42],
        message: 'Testmessage'
      }).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          my_post_id = res.body._id;
          request.post('/posts/?apiKey=theotheruserapikey').send({
            coordinates: [11, 47],
            message: 'Testmessage'
          }).end(function (err, res) {
            other_post_id = res.body._id;
            done(err);
          });
        }
      });
    });

    describe('HTTP GET', function () {
      describe('without API key', function () {
        it('should return 200 OK and the correct post', function (done) {
          request.get('/posts/' + other_post_id).expect(200, function (err, res) {
            var post = res.body;
            expect(post.properties.message).to.equal('Testmessage');
            expect(post.properties.user._id).to.equal(otheruser._id.toString());
            expect(post.properties.user.name).to.equal(otheruser.name);
            expect(post.properties.relevance).to.be.a('number');
            expect(post.geometry.type).to.equal('Point');
            expect(post.geometry.coordinates).to.eql([11, 47]);

            done(err);
          });
        });
        it('should return 404 NOT FOUND with an unkown post id', function (done) {
          request.get('/posts/deadbeef').expect(404, done);
        });
        it('should return 400 BAD REQUEST with an invalid post id', function (done) {
          request.get('/posts/valid_ids_may_only_be_hex_numbers').expect(400, done);
        });
      });
      describe('with API key', function () {
        it('should return 200 OK and the correct post', function (done) {
          request.get('/posts/' + other_post_id + '?apiKey=thetestuserapikey').expect(200, function (err, res) {
            var post = res.body;
            expect(post.properties.message).to.equal('Testmessage');
            expect(post.properties.user._id).to.equal(otheruser._id.toString());
            expect(post.properties.user.name).to.equal(otheruser.name);
            expect(post.properties.relevance).to.be.a('number');
            expect(post.geometry.type).to.equal('Point');
            expect(post.geometry.coordinates).to.eql([11, 47]);

            done(err);
          });
        });
        it('should return 404 NOT FOUND with an unkown post id', function (done) {
          request.get('/posts/deadbeef?apiKey=thetestuserapikey').expect(404, done);
        });
        it('should return 400 BAD REQUEST with an invalid post id', function (done) {
          request.get('/posts/valid_ids_may_only_be_hex_numbers?apiKey=thetestuserapikey').expect(400, done);
        });
      });
    });
    describe('HTTP POST', function () {
    });
    describe('HTTP DELETE', function () {
      describe('without API key', function () {
        it('should return 403 FORBIDDEN when trying to delete a post', function (done) {
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
        it('should return 403 FORBIDDEN when trying to delete an unkown post id', function (done) {
          request.delete('/posts/deadbeef').expect(403, done);
        });
        it('should return 403 FORBIDDEN when trying to delete an invalid post id', function (done) {
          request.delete('/posts/valid_ids_may_only_be_hex_numbers').expect(403, done);
        });
      });
      describe('with API key', function () {
        it('should return 204 NO CONTENT when deleting an own post', function (done) {
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
        it('should return 403 FORBIDDEN when trying to delete a foreign post', function (done) {
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
        it('should return 404 NOT FOUND when trying to delete an unkown post id', function (done) {
          request.delete('/posts/deadbeef?apiKey=thetestuserapikey').expect(404, done);
        });
        it('should return 400 BAD REQUEST when trying to delete an invalid post id', function (done) {
          request.delete('/posts/valid_ids_may_only_be_hex_numbers?apiKey=thetestuserapikey').expect(400, done);
        });
      });
    });
  });
});