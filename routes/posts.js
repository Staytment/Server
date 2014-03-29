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

exports.list = function (req, res) {
  var collection = db.get('posts');
  collection.find({}, {}, function (e, docs) {
    res.send(docs);
  });
};

exports.create = function (req, res) {
  var post = {
    "lat": 5.552,
    "long": 2.342,
    "message": "Bong!",
    "tags": ["Lifestyle", "Restaurant", "YOLO"],
    "relevance": 1337,
    "user": 42
  };
  var collection = db.get('posts');
  collection.insert(post);
  res.send(post);
};