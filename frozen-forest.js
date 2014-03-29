// web.js
var express = require('express');
var logfmt = require('logfmt');

var posts = require('./routes/posts');

var app = express();
app.use(logfmt.requestLogger());

app.all('/', require('./routes/index'));
app.get('/posts', posts.list);
app.put('/posts', posts.create);

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log('Listening on localhost:' + port);
});