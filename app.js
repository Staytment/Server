var db = require(__dirname+'/database');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var logfmt = require('logfmt');
var validator = require(__dirname+'/data-validator');
var swagger = require('swagger-node-express');
var auth = require(__dirname+'/routes/auth');

var posts = require(__dirname+'/routes/posts');
var cors = require('cors');

// ensure db index
db.get('posts').ensureIndex({geometry: '2dsphere'});
db.get('users').ensureIndex({apiKey: 1});

var app = express();
app.use(cors());
app.use(logfmt.requestLogger());
app.use(compression());
app.use(bodyParser.json());
app.use(function (error, req, res, next) {
  //Catch json error
  res.send(res, {code: 400, message: 'Bad request'});
});
app.use(bodyParser.urlencoded());
app.use(validator());
auth(app);
app.use(function (req, res, next) {
  // Check for api key and set req.user
  var apiKey = req.param('api_key') || req.param('apiKey');
  if (apiKey) {
    db.get('users').findOne({apiKey: apiKey}, function (err, user) {
      if (!user) {
        res.json({
          message: 'forbidden',
          code: 403
        }, 403);
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    req.user = {name: 'Anonymous', readOnly: true};
    next();
  }
});
app.all('/', require('./routes/index'));

swagger.setAppHandler(app);
swagger.configureSwaggerPaths('', '/api-docs', '');

swagger.addGet(posts.getPostList);
swagger.addGet(posts.getPostListByRectangle);
swagger.addGet(posts.getPostListByPoint);
swagger.addGet(posts.getPost);
swagger.addPost(posts.createPost);
swagger.addDelete(posts.deletePost);

swagger.configure(process.env.DOMAIN_API || 'http://localhost:5000', '0.4.2');

module.exports = app;