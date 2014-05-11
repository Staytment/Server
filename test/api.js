var expect = require('chai').expect;
var request = require('supertest')('http://localhost:5000');

describe('API', function () {
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

    it('/auth/google should redirect to Google oAuth2', function (done) {
      request.get('/auth/google').expect(302, function(err, res) {
        expect(res.header['location']).to.match(/^https:\/\/accounts.google.com\/o\/oauth2\/auth/);
        done(err);
      });
    });
    it('/auth/facebook should redirect to Facebook oAuth2', function (done) {
      request.get('/auth/facebook').expect(302, function(err, res) {
        expect(res.header['location']).to.match(/^https:\/\/www.facebook.com\/dialog\/oauth/);
        done(err);
      });
    });
  });
});