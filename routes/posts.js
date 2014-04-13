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
var errors = swagger.errors;

//exports.list = function (req, res) {
//  posts.find({}, {fields: config.posts.publicFields}, function (err, docs) {
//    for (var i = 0; i < docs.length; i++) {
//      docs[i].link = config.baseUrl + '/posts/' + docs[i]._id;
//    }
//    res.send(docs);
//  });
//};

exports.getPostList = {
  spec: {
    description: 'Fetch a list of all posts (just for development purposes, will be removed or changed in future)',
    path: '/posts',
    notes: 'Returns a list of all posts. This method is for development purposes and will be changed or removed in future.',
    summary: 'Fetch a list of all posts (dev only)',
    method: 'GET',
    type: 'array',
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

exports.getPost = {
  spec: {
    description: 'Fetches a single post by id',
    path: '/posts/{postId}',
    notes: 'Uses the passed postId parameter to search for a post. The postId must be a valid MongoDB ID, i.e. it needs to be a hex number.',
    summary: 'Fetches a single post',
    method: 'GET',
    type: 'Post',
    nickname: 'getPost',
    parameters: [swagger.pathParam('postId', 'ID of the post that should be fetched', 'hex')],
    responseMessages: [errors.notFound('Post'), errors.invalid('postId')]
  },
  action: function (req, res) {
    req.assert('postId').isHexadecimal();
    req.sanitize('postId').toString();
    if (req.validationErrors()) {
      errors.invalid('postId', res);
      return;
    }
    posts.findById(req.param('postId'), {fields: config.posts.publicFields}, function (err, doc) {
      if (!doc) {
        errors.notFound('Post', res);
        return
      }
      doc.link = config.baseUrl + '/posts/' + doc._id;
      res.json(doc);
    });
  }
};

exports.createPost = {
  spec: {
    description: 'Create a new post',
    path: '/posts/',
    notes: 'You need to give the message of the post and the coordinates. The user will be automatically assigned and a unique id will be generated and given to you in the response.',
    summary: 'Create a new post',
    method: 'POST',
    type: 'Post',
    nickname: 'createPost',
    parameters: [
      swagger.bodyParam('post', 'JSON with the keys "lat", "long" and "message"', 'Post')
    ],
    responseMessages: [
      errors.invalid('lat'),
      errors.invalid('long'),
      errors.invalid('message')
    ]
  },
  action: function (req, res) {
    req.assert('lat', 'not a valid latitude value').isLat();
    req.assert('long', 'not a valid longitude value').isLong();
    req.assert('message', 'required').notEmpty();
    req.sanitize('lat').toFloat();
    req.sanitize('long').toFloat();
    req.sanitize('message').toString();

    var validationErrors = req.validationErrors();
    if (validationErrors) {
      if (validationErrors[0].param == 'lat') {
        errors.invalid('lat', res);
      } else if (validationErrors[0].param == 'long') {
        errors.invalid('long', res);
      } else if (validationErrors[0].param == 'message') {
        errors.invalid('message', res);
      }
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
    res.json(post);
  }
};