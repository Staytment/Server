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
var config = require('../config.json');
var swagger = require('swagger-node-express');

//exports.list = function (req, res) {
//  posts.find({}, {fields: config.posts.publicFields}, function (err, docs) {
//    for (var i = 0; i < docs.length; i++) {
//      docs[i].link = config.baseUrl + '/posts/' + docs[i]._id;
//    }
//    res.send(docs);
//  });
//};

exports.list = {
  spec: {
    description: 'Fetch a list of all posts (just for development purposes, will be removed or changed in future)',
    path: '/posts',
    notes: 'Returns a list of all posts. This method is for development purposes and will be changed or removed in future.',
    summary: 'Fetch a list of all posts (dev only)',
    method: 'GET',
    type : 'array',
    items: {
      $ref: 'Post'
    },
    nickname: 'getPostList'
  },
  action: function (req, res) {
    posts.find({}, {fields: config.posts.publicFields}, function (err, docs) {
      res.send(docs);
    });
  }
};

exports.load = function (req, res) {
  req.assert('id').isHexadecimal();
  req.sanitize('id').toString();
  var errors = req.validationErrors();
  if (errors) {
    res.send({'error': errors});
    return;
  }
  posts.findById(req.param('id'), {fields: config.posts.publicFields}, function (err, doc) {
    doc.link = config.baseUrl + '/posts/' + doc._id;
    res.json(doc);
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
    res.send({error: errors});
    return;
  }
  var post = {
    lat: req.param('lat'),
    long: req.param('long'),
    message: req.param('message'),
    tags: [],
    relevance: 100,
    user: 0
  };
  posts.insert(post);
  res.json({
    lat: post.lat,
    long: post.long,
    message: post.message,
    relevance: post.relevance,
    _id: post._id,
    link: config.baseUrl + '/posts/' + post._id
  });
};