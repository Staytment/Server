/*jshint expr: true*/
var expect = require('chai').expect;
var request = require('supertest')('http://localhost:5001');
var db = require(__dirname + '/../database');
var users = db.get('users');
var posts = db.get('posts');

describe('API', function () {
  this.timeout(10000);
  var testuser;
  var otheruser;
  before(function () {
    users.findOne({apiKey: 'thetestuserapikey'}, function (err, doc) {
      expect(err).to.be.null;
      testuser = doc;
    });
    users.findOne({apiKey: 'theotheruserapikey'}, function (err, doc) {
      expect(err).to.be.null;
      otheruser = doc;
    });
  });

  describe('Authentication', function () {
    it('should allow access without api key', function (done) {
      request.get('/').expect(200, done);
    });
    it('should return 403 FORBIDDEN with an invalid api key', function (done) {
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
        expect(res.header.location).to.match(/^https:\/\/accounts.google.com\/o\/oauth2\/auth/);
        done(err);
      });
    });
    it('should redirect /auth/facebook to Facebook oAuth2', function (done) {
      request.get('/auth/facebook').expect(302, function (err, res) {
        if (err) {
          done(err);
        }
        expect(res.header.location).to.match(/^https:\/\/www.facebook.com\/dialog\/oauth/);
        done();
      });
    });
  });

  describe('/posts', function () {
    describe('HTTP GET', function () {
      it('should return 200 OK', function (done) {
        request.get('/posts/').expect(200, done);
      });
      it('should not return more than 25 posts', function (done) {
        request.get('/posts/').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(26);
          done();
        });
      });
      it('should not return more than 10 posts if parameter "limit=10" is passed', function (done) {
        request.get('/posts/?limit=10').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(11);
          done();
        });
      });
      it('should return posts with a coordinate pair', function (done) {
        request.get('/posts/').expect(200, function (err, res) {
          var posts = res.body.features;
          var post = posts[0];
          expect(post.geometry.coordinates.length).to.equal(2);
          done(err);
        });
      });
      it('should return posts with a message text', function (done) {
        request.get('/posts/').expect(200, function (err, res) {
          var posts = res.body;
          var post = posts.features[0];
          expect(post.properties.message).to.exist;
          done(err);
        });
      });
      it('should return posts with a username and an id', function (done) {
        request.get('/posts/').expect(200, function (err, res) {
          var posts = res.body.features;
          var post = posts[0];
          expect(post.properties.user._id).to.exist;
          expect(post.properties.user.name).to.exist;
          done(err);
        });
      });
      it('should only return posts within a specified area', function (done) {
        request.get('/posts/?filter=rectangle&long1=8&lat1=45&long2=8&lat2=55&long3=10&lat3=55&long4=10&lat4=45').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          for (var i = 0; i < posts.length; i++) {
            expect(posts[i].geometry.coordinates[0]).to.be.at.least(7.9);
            expect(posts[i].geometry.coordinates[0]).to.be.at.most(10.1);
            expect(posts[i].geometry.coordinates[1]).to.be.at.least(44.9);
            expect(posts[i].geometry.coordinates[1]).to.be.at.most(55.1);
          }
          done();
        });
      });
      it('should not allow 3 coordinates', function (done) {
        request.get('/posts/?filter=rectangle&long1=8&lat1=45&long2=8&lat2=55&long3=10&lat3=55').expect(400, done);
      });
      it('should only return posts within distance X to a specified point', function (done) {
        request.get('/posts/?filter=point&long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          for (var i = 0; i < posts.length; i++) {
            expect(posts[i].geometry.coordinates[0]).to.be.at.least(19);
            expect(posts[i].geometry.coordinates[0]).to.be.at.most(21);
            expect(posts[i].geometry.coordinates[1]).to.be.at.least(39);
            expect(posts[i].geometry.coordinates[1]).to.be.at.most(41);
          }
          done();
        });
      });
      it('should require a distance when filtering from a specified point', function (done) {
        request.get('/posts/?filter=point&long=20&lat=40').expect(400, done);
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
    describe('HTTP POST', function () {
      describe('without API key', function () {
        it('should return 403 FORBIDDEN', function (done) {
          request.post('/posts/').send({
            coordinates: [13, 37],
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
            if (err) {
              done(err);
            }
            var post = res.body;
            expect(post.type).to.equal('Feature');
            expect(post.properties.message).to.equal('Testmessage');
            expect(post.properties.user._id).to.equal(testuser._id.toString());
            expect(post.properties.user.name).to.equal(testuser.name);
            expect(post.properties.relevance).to.be.a('number');
            expect(post.geometry.type).to.equal('Point');
            expect(post.geometry.coordinates).to.eql([13, 37]);

            done();
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
          }).expect(400, done);
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
            coordinates: [
              [2, 3],
              [4, 5]
            ],
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
        }
        my_post_id = res.body._id;
        request.post('/posts/?apiKey=theotheruserapikey').send({
          coordinates: [11, 47],
          message: 'Testmessage'
        }).end(function (err, res) {
          if (err) {
            done(err);
          }
          other_post_id = res.body._id;
          done();
        });
      });
    });

    describe('HTTP GET', function () {
      it('should return 200 OK and the correct post', function (done) {
        request.get('/posts/' + other_post_id).expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var post = res.body;
          expect(post.properties.message).to.equal('Testmessage');
          expect(post.properties.user._id).to.equal(otheruser._id.toString());
          expect(post.properties.user.name).to.equal(otheruser.name);
          expect(post.properties.relevance).to.be.a('number');
          expect(post.geometry.type).to.equal('Point');
          expect(post.geometry.coordinates).to.eql([11, 47]);

          done();
        });
      });
      it('should return 404 NOT FOUND with an unkown post id', function (done) {
        request.get('/posts/deadbeef').expect(404, done);
      });
      it('should return 400 BAD REQUEST with an invalid post id', function (done) {
        request.get('/posts/valid_ids_may_only_be_hex_numbers').expect(400, done);
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
  describe('/posts/by-rectangle', function () {
    describe('HTTP GET', function () {
      it('should return 400 BAD REQUEST without parameters', function (done) {
        request.get('/posts/by-rectangle/').expect(400, done);
      });
      it('should return 200 OK', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55').expect(200, done);
      });
      it('should not return more than 15 posts (due to resolution 3*5)', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&horizontal_resolution=3&vertical_resolution=5').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(16);
          done();
        });
      });
      it('should not return more than 30 posts (6*5)', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&horizontal_resolution=6&vertical_resolution=5').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(31);
          done();
        });
      });
      it('should return posts with a coordinate pair', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          var post = posts[0];
          expect(post.geometry.coordinates.length).to.equal(2);
          done();
        });
      });
      it('should return posts with a message text', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body;
          var post = posts.features[0];
          expect(post.properties.message).to.exist;
          done();
        });
      });
      it('should return posts with a username and an id', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          var post = posts[0];
          expect(post.properties.user._id).to.exist;
          expect(post.properties.user.name).to.exist;
          done();
        });
      });
      it('should only return posts within a specified area', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          for (var i = 0; i < posts.length; i++) {
            expect(posts[i].geometry.coordinates[0]).to.be.at.least(7.9);
            expect(posts[i].geometry.coordinates[0]).to.be.at.most(10.1);
            expect(posts[i].geometry.coordinates[1]).to.be.at.least(44.9);
            expect(posts[i].geometry.coordinates[1]).to.be.at.most(55.1);
          }
          done();
        });
      });
      it('should not allow only 1 coordinate', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45').expect(400, done);
      });
      it('should not allow negative horizontal resolution', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&horizontal_resolution=-2').expect(400, done);
      });
      it('should not allow negative vertical resolution', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&vertical_resolution=-2').expect(400, done);
      });
      it('should not allow horizontal resolution > 10', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&horizontal_resolution=11').expect(400, done);
      });
      it('should not allow vertical resolution > 10', function (done) {
        request.get('/posts/by-rectangle/?long1=8&lat1=45&long2=10&lat2=55&vertical_resolution=11').expect(400, done);
      });
      it('should not return "null" instead of a GeoJSON object', function (done) {
        request.get('/posts/by-rectangle/?long1=14&lat1=52&long2=17&lat2=51').expect(200, function(err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          for (var i = 0; i < posts.length; i++) {
            expect(posts[i]).to.exist;
          }
          done();
        });
      });
    });
  });
  describe('/posts/by-point', function () {
    describe('HTTP GET', function () {
      it('should return 400 BAD REQUEST without parameters', function (done) {
        request.get('/posts/by-point').expect(400, done);
      });

      it('should return 200 OK', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, done);
      });
      it('should not return more than 25 posts', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(26);
          done();
        });
      });
      it('should not return more than 10 posts if parameter "limit=10" is passed', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=10').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          expect(posts.length).to.be.lessThan(11);
          done();
        });
      });
      it('should return posts with a coordinate pair', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          var post = posts[0];
          expect(post.geometry.coordinates.length).to.equal(2);
          done();
        });
      });
      it('should return posts with a message text', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body;
          var post = posts.features[0];
          expect(post.properties.message).to.exist;
          done();
        });
      });
      it('should return posts with a username and an id', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          var post = posts[0];
          expect(post.properties.user._id).to.exist;
          expect(post.properties.user.name).to.exist;
          done();
        });
      });
      it('should only return posts within distance X to a specified point', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000').expect(200, function (err, res) {
          if (err) {
            done(err);
          }
          var posts = res.body.features;
          for (var i = 0; i < posts.length; i++) {
            expect(posts[i].geometry.coordinates[0]).to.be.at.least(19);
            expect(posts[i].geometry.coordinates[0]).to.be.at.most(21);
            expect(posts[i].geometry.coordinates[1]).to.be.at.least(39);
            expect(posts[i].geometry.coordinates[1]).to.be.at.most(41);
          }
          done();
        });
      });
      it('should require a distance when filtering from a specified point', function (done) {
        request.get('/posts/by-point/?long=20&lat=40').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is above 25', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=26').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is 0', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=0').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is negative', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=-10').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is a letter', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=a').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is a text', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=abcde').expect(400, done);
      });
      it('should return 400 BAD REQUEST if parameter "limit" is a text with special characters', function (done) {
        request.get('/posts/by-point/?long=20&lat=40&distance=100000&limit=äöüß').expect(400, done);
      });
    });
  });
});
