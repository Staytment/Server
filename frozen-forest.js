// Newrelic monitoring
require('newrelic');

var db = require('./database');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var logfmt = require('logfmt');
var validator = require('./data-validator');
var swagger = require('swagger-node-express');
var auth = require('./routes/auth');

var posts = require('./routes/posts');
var cors = require('cors');

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
swagger.addGet(posts.getPost);
swagger.addPost(posts.createPost);
swagger.addDelete(posts.deletePost);

swagger.configure(process.env.DOMAIN_API || 'http://localhost:5000', '0.4');
var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log('Listening on localhost:' + port);
});