var express = require('express');
var logfmt = require('logfmt');
var validator = require('./data-validator');
var swagger = require('swagger-node-express');
var models = require('./models.json');

var posts = require('./routes/posts');

var app = express();
app.use(logfmt.requestLogger());
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(validator());

swagger.setAppHandler(app);
swagger.configureSwaggerPaths("", "/api-docs", "");
swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
//    if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
//      var apiKey = req.headers["api_key"];
//      if (!apiKey) {
//        apiKey = url.parse(req.url,true).query["api_key"];
//      }
//      if ("special-key" == apiKey) {
//        return true;
//      }
//      return false;
//    }
    return true;
  }
);
swagger.addModels(models);

app.all('/', require('./routes/index'));
swagger.addGet(posts.list);
//app.post('/posts', posts.create);
app.get('/posts/:id', posts.load);



swagger.configure("http://localhost:5000", "0.1");
var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log('Listening on localhost:' + port);
});