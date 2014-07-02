var db = require('../database.js');
var posts = db.get('posts');
var config = require('../config.json');
var swagger = require('swagger-node-express');
var errors = swagger.errors;

exports.getPostList = {
  spec: {
    description: 'Fetch a list of all posts (just for development purposes, will be removed or changed in future)',
    path: '/posts',
    notes: 'Returns a list of all posts. This method is for development purposes and will be changed or removed in future.',
    summary: 'Fetch a list of all posts (dev only)',
    method: 'GET',
    type: 'array',
    nickname: 'getPostList',
    parameters: [swagger.queryParam('limit', 'Limit the response to n posts. Valid range: 1-25, default 25.', 'Number')],
    items: {
      $ref: 'Post'
    }
  },
  action: function (req, res) {
    var limit = req.param('limit');
    if (limit != undefined) {
      req.assert('limit').isInt();
      req.sanitize('limit').toInt();
      if (req.validationErrors()) {
        errors.invalid('limit', res);
        return;
      }
    } else {
      limit = 25;
    }
    if (limit < 1 || limit > 25) {
      errors.invalid('limit', res);
      return;
    }
    posts.find({}, {limit: limit, fields: config.posts.publicFields}, function (err, docs) {
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
    posts.findOne({_id: req.param('postId')}, {fields: config.posts.publicFields}, function (err, doc) {
      if (!doc) {
        errors.notFound('Post', res);
        return
      }
      res.json(doc);
    });
  }
};

exports.createPost = {
  spec: {
    description: 'Create a new post',
    path: '/posts/',
    notes: 'You need to give the message of the post and the coordinates. The user will be automatically assigned and a unique id will be generated and given to you in the response.',
    summary: 'Create a new post. API key required.',
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
    if (req.user.readOnly) {
      errors.forbidden(res);
      return;
    }
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
      user: req.user._id
    };
    posts.insert(post);
    res.json(post);
  }
};

exports.deletePost = {
  spec: {
    description: 'Deletes a post',
    path: '/posts/{postId}',
    notes: 'Deletes the post with the passed postId. The postId must be a valid MongoDB ID, i.e. it needs to be a hex number. Will return "204 - No Content" on success. You may only delete posts your own posts.',
    summary: 'Deletes a post. API key required.',
    method: 'DELETE',
    type: 'void',
    nickname: 'deletePost',
    parameters: [swagger.pathParam('postId', 'ID of the post that should be deleted', 'hex')],
    responseMessages: [errors.notFound('Post'), errors.invalid('postId'), errors.forbidden()]
  },
  action: function (req, res) {
    if (req.user.readOnly) {
      errors.forbidden(res);
      return;
    }
    req.assert('postId').isHexadecimal();
    req.sanitize('postId').toString();
    if (req.validationErrors()) {
      errors.invalid('postId', res);
      return;
    }
    posts.findOne({_id: req.param('postId')}, function (err, doc) {
      if (!doc) {
        errors.notFound('Post', res);
        return
      }
      if (!doc.user.equals(req.user._id)) {
        errors.forbidden(res);
        return
      }
      posts.findAndModify({_id: req.param('postId'), user: req.user._id}, {}, {remove: true}, function (err, doc) {
        res.send(err || 204);
      });
    });
  }
};