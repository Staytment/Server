var app = require(__dirname+'/app.js');
var port = Number(process.env.PORT || 5000);

app.listen(port, function () {
  console.log('Listening on localhost:' + port);
});