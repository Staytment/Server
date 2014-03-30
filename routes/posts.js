//exports.list = function (req, res) {
//  res.send({
//      "lat": 5.552,
//      "long": 2.342,
//      "message": "Bong!",
//      "tags": ["Lifestyle", "Restaurant", "YOLO"],
//      "relevance": 1337,
//      "user": 42
//    });
//};

var db = require('../database.js');
var posts = db.get('posts');

exports.list = function (req, res) {
  var collection = db.get('posts');
  collection.find({}, {}, function (e, docs) {
    res.send(docs);
  });
};

exports.create = function (req, res) {
  req.assert('lat', 'not a valid latitude value').isLat();
  req.assert('long', 'not a valid longitude value').isLong();
  req.assert('message', 'required').notEmpty();
  req.sanitize('lat').toFloat();
  req.sanitize('long').toFloat();
  req.sanitize('message').toString();

  var errors = req.validationErrors();
  if (errors) {
    res.send({'error': errors});
    return;
  }
  var post = {
    "lat": req.param('lat'),
    "long": req.param('long'),
    "message": 'empty',
    "tags": [],
    "relevance": 100,
    "user": 0
  };
  posts.insert(post);
  res.json(post);
};